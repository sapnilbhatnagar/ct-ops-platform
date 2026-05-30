import "server-only";
import { hashPhone, maskPhone } from "./phone";
import { runIntakeAgent } from "./anthropic";
import { sendText, sendTemplate } from "./aisensy";
import {
  createLead,
  updateLead,
  findLeadIdByPhoneHash,
  getActiveCampaignCriteria,
} from "./airtable";
import { getSession, saveSession, type ConversationSession } from "./sessions";
import { flushLangfuse } from "./langfuse";
import { fieldsFromCriteria } from "@/lib/types";
import { env } from "./env";
import type { Message } from "@/lib/types";

export type IntakeResult = {
  sessionId: string;
  reply: string;
  classification: string;
  complete: boolean;
  airtableRecordId: string | null;
};

/**
 * Core intake flow. Called by both the real AISensy webhook route and the
 * /api/dev/simulate-message endpoint. Returns enough state for the caller
 * to build a response without knowing about Airtable or session internals.
 */
export async function handleInboundMessage(
  phone: string,
  text: string,
  messageId: string,
  timestamp: string,
): Promise<IntakeResult> {
  const sessionId = hashPhone(phone);
  const phoneMasked = maskPhone(phone);
  const now = timestamp || new Date().toISOString();

  // Resolve the active campaign's qualifying criteria so the agent extracts
  // exactly what the admin configured (defaults + any custom parameters).
  const criteria = await getActiveCampaignCriteria();

  // ── Load or create session ───────────────────────────────────────────────
  let session: ConversationSession = getSession(sessionId) ?? {
    sessionId,
    airtableRecordId: null,
    messages: [],
    extractedFields: fieldsFromCriteria(criteria),
    classification: "unclassified",
    complete: false,
    lastActivityAt: now,
  };

  if (session.complete) {
    // Conversation already finished — acknowledge and skip intake
    await sendText(phone, "Thanks for reaching out! Our team will be in touch.");
    await flushLangfuse();
    return {
      sessionId,
      reply: "Thanks for reaching out! Our team will be in touch.",
      classification: session.classification,
      complete: true,
      airtableRecordId: session.airtableRecordId,
    };
  }

  // Append inbound message to history
  const userMsg: Message = {
    id: messageId,
    role: "user",
    content: text,
    timestamp: now,
    type: "text",
  };

  // ── Run intake agent ─────────────────────────────────────────────────────
  const agentResult = await runIntakeAgent({
    sessionId,
    history: session.messages,
    newUserMessage: text,
    existingFields: session.extractedFields,
    criteria,
  });

  const agentMsg: Message = {
    id: `agent_${Date.now()}`,
    role: "agent",
    content: agentResult.reply,
    timestamp: new Date().toISOString(),
    type: "text",
  };

  const updatedMessages = [...session.messages, userMsg, agentMsg];

  // ── Persist to Airtable (skipped gracefully if no base ID configured) ────
  const airtableConfigured = !!env.airtable.baseId();
  let airtableRecordId = session.airtableRecordId;

  if (airtableConfigured) {
    if (!airtableRecordId) {
      // First turn: create the lead record
      const existingId = await findLeadIdByPhoneHash(sessionId);
      if (existingId) {
        airtableRecordId = existingId;
      } else {
        airtableRecordId = await createLead({
          id: sessionId,
          contactName: agentResult.extractedFields.find((f) => f.key === "name")?.value ?? null,
          phoneMasked,
          language: "en",
          source: "meta_ad",
          status: "in_progress",
          classification: agentResult.classification,
          classificationSource: "model",
          classificationReason: agentResult.classificationReason,
          assignedToId: null,
          extractedFields: agentResult.extractedFields,
          messages: updatedMessages,
          startedAt: session.messages.length === 0 ? now : session.lastActivityAt,
          lastActivityAt: now,
        });
      }
    } else {
      await updateLead(airtableRecordId, {
        classification: agentResult.classification,
        classificationSource: "model",
        classificationReason: agentResult.classificationReason,
        extractedFields: agentResult.extractedFields,
        messages: updatedMessages,
        lastActivityAt: now,
        contactName: agentResult.extractedFields.find((f) => f.key === "name")?.value ?? null,
        status: agentResult.complete ? "complete" : "in_progress",
      });
    }
  }

  // ── Hot lead notification ────────────────────────────────────────────────
  // Fire only on the transition into "hot" so the agent is pinged once.
  const wasHot = session.classification === "hot";
  const isHot = agentResult.classification === "hot";

  if (isHot && !wasHot && airtableRecordId) {
    const fields = agentResult.extractedFields;
    const get = (key: string) => fields.find((f) => f.key === key)?.value ?? "";
    const notifyResult = await sendTemplate(
      env.aisensy.simMode() ? "sim_agent" : env.aisensy.agentPhone(),
      env.aisensy.templateHotLead(),
      {
        "1": agentResult.extractedFields.find((f) => f.key === "name")?.value ?? "Unknown",
        "2": get("destination"),
        "3": get("travel_dates"),
        "4": get("group_size"),
        "5": get("budget"),
        "6": airtableRecordId
          ? `https://airtable.com/${env.airtable.baseId()}/${airtableRecordId}`
          : "(no link)",
      },
    );
    if (notifyResult.ok && airtableRecordId && airtableConfigured) {
      await updateLead(airtableRecordId, { agentNotifiedAt: new Date().toISOString() });
    }
  }

  // ── Send reply ───────────────────────────────────────────────────────────
  await sendText(phone, agentResult.reply);

  // ── Update session ───────────────────────────────────────────────────────
  saveSession({
    ...session,
    airtableRecordId,
    messages: updatedMessages,
    extractedFields: agentResult.extractedFields,
    classification: agentResult.classification,
    complete: agentResult.complete,
    lastActivityAt: now,
  });

  await flushLangfuse();

  return {
    sessionId,
    reply: agentResult.reply,
    classification: agentResult.classification,
    complete: agentResult.complete,
    airtableRecordId,
  };
}
