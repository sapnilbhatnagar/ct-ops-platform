import "server-only";
import crypto from "node:crypto";
import { env } from "./env";

/**
 * AISensy outbound + webhook utilities.
 *
 * SIM MODE (AISENSY_SIM_MODE=true):
 *   sendText / sendTemplate log to console and return { ok: true }.
 *   verifyWebhookSignature always returns true.
 *   No real WhatsApp messages are sent.
 *   Wire in real AISensy credentials to exit sim mode.
 *
 * PRODUCTION NOTE:
 *   Outbound endpoint paths, payload shapes, and signature scheme below
 *   are best-guess based on AISensy's documented API patterns. Confirm
 *   against their dashboard / support before going live (Phase 1b.0 audit).
 */

type SendResult = { ok: true; messageId?: string } | { ok: false; error: string };

const AISENSY_BASE_URL = "https://backend.aisensy.com";

export async function sendText(phone: string, text: string): Promise<SendResult> {
  if (env.aisensy.simMode()) {
    console.log(`[AISensy SIM] → ${phone}: ${text.slice(0, 120)}`);
    return { ok: true, messageId: `sim_${Date.now()}` };
  }
  try {
    const res = await fetch(`${AISENSY_BASE_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.aisensy.apiKey()}`,
      },
      body: JSON.stringify({ to: phone, type: "text", text: { body: text } }),
    });
    if (!res.ok) return { ok: false, error: `AISensy ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as { messageId?: string };
    return { ok: true, messageId: data.messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function sendTemplate(
  phone: string,
  templateName: string,
  variables: Record<string, string>,
): Promise<SendResult> {
  if (env.aisensy.simMode()) {
    console.log(`[AISensy SIM] template ${templateName} → ${phone}`, variables);
    return { ok: true, messageId: `sim_${Date.now()}` };
  }
  try {
    const res = await fetch(`${AISENSY_BASE_URL}/api/templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.aisensy.apiKey()}`,
      },
      body: JSON.stringify({ to: phone, template: templateName, variables }),
    });
    if (!res.ok) return { ok: false, error: `AISensy ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as { messageId?: string };
    return { ok: true, messageId: data.messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export type InboundWhatsappEvent = {
  phone: string;
  messageId: string;
  text: string | null;
  type: "text" | "voice" | "image" | "unknown";
  timestamp: string;
};

export function parseInboundWebhook(raw: unknown): InboundWhatsappEvent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;
  const phone = body.from ?? body.sender ?? body.phone;
  const text = body.text ?? body.body ?? body.message;
  const messageId = body.messageId ?? body.id;
  const timestamp = body.timestamp ?? new Date().toISOString();
  if (typeof phone !== "string" || typeof messageId !== "string") return null;
  return {
    phone,
    messageId,
    text: typeof text === "string" ? text : null,
    type:
      typeof text === "string"
        ? "text"
        : body.type === "voice"
        ? "voice"
        : body.type === "image"
        ? "image"
        : "unknown",
    timestamp: String(timestamp),
  };
}

export function verifyWebhookSignature(signature: string | null, rawBody: string): boolean {
  if (env.aisensy.simMode()) return true;
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", env.aisensy.webhookSecret())
    .update(rawBody, "utf8")
    .digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
