import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";
import { startTurnTrace, startTrace } from "./langfuse";
import type {
  Classification,
  ExtractedField,
  Message,
  QualifyingCriterion,
} from "@/lib/types";
import { FIELD_LABELS, fieldsFromCriteria } from "@/lib/types";

let _client: Anthropic | null = null;

function client(): Anthropic {
  if (_client) return _client;
  _client = new Anthropic({ apiKey: env.anthropic.apiKey() });
  return _client;
}

function buildSystemPrompt(criteria: QualifyingCriterion[]): string {
  const fieldList = criteria.map((c, i) => `${i + 1}. ${c.key} (${c.label})`).join("\n");
  const jsonShape = criteria.map((c) => `    "${c.key}": "string or null"`).join(",\n");
  return `You are the intake agent for Connecting Traveller, a small-group travel company in India. You qualify inbound WhatsApp leads from Meta ads.

Tone: warm, brief, professional, never robotic. Match the user's language (English, Hindi, or Hinglish). You are an AI, but do not announce that unless directly asked.

Your job is to gather these qualifying fields in a natural conversation, not a form:
${fieldList}

Rules:
- Ask at most one question per message. Never list multiple questions.
- If the user volunteers information, acknowledge it and skip to the next gap.
- If the user goes off-topic, answer briefly and steer back to the next missing field.
- If the user sends a voice note or image, reply that you cannot process those yet and ask them to type.
- Once all fields are collected, send a short closing message confirming next steps.
- If the conversation goes more than 10 turns without progress, close politely and mark the lead incomplete.

Classification logic (decide from the fields plus context):
- hot: group_size >= 2, travel_dates within 60 days, budget at or above Rs 15,000/person (or Rs 30,000 total), urgency expressed
- warm: any 3+ fields filled, intent clear, but timing or budget soft
- cold: vague, browsing, no concrete intent
- unclassified: not enough information to decide yet

Output format: Always return STRICT JSON only (no prose around it) with this shape:

{
  "reply": "the message text to send back to the user via WhatsApp",
  "extractedFields": {
${jsonShape}
  },
  "classification": "hot" | "warm" | "cold" | "unclassified",
  "classificationReason": "one sentence",
  "complete": true | false
}

Use exactly the field keys listed above in extractedFields. Set complete=true only when every field is filled AND you have sent a closing message.`;
}

type IntakeAgentInput = {
  sessionId: string;
  history: Message[];
  newUserMessage: string;
  existingFields: ExtractedField[];
  criteria: QualifyingCriterion[];
};

type IntakeAgentOutput = {
  reply: string;
  extractedFields: ExtractedField[];
  classification: Classification;
  classificationReason: string;
  complete: boolean;
};

function mergeFields(
  existing: ExtractedField[],
  update: Record<string, string | null>,
  turnIndex: number,
): ExtractedField[] {
  return existing.map((f) => {
    const newVal = update[f.key];
    if (newVal === undefined || newVal === null || newVal === "") return f;
    return {
      ...f,
      value: newVal,
      confidence: 0.85,
      extractedAtMessageIndex: turnIndex,
    };
  });
}

export async function runIntakeAgent(input: IntakeAgentInput): Promise<IntakeAgentOutput> {
  const trace = startTurnTrace({
    sessionId: input.sessionId,
    name: "intake-turn",
    metadata: {
      turnIndex: input.history.length,
      filledFields: input.existingFields.filter((f) => f.value !== null).length,
    },
  });

  const systemPrompt = buildSystemPrompt(input.criteria);

  const generation = trace.generation({
    name: "claude-intake",
    model: env.anthropic.model(),
    input: {
      system: systemPrompt,
      history: input.history.map((m) => ({ role: m.role, content: m.content })),
      newUserMessage: input.newUserMessage,
    },
  });

  const messages = [
    ...input.history.map((m) => ({
      role: m.role === "agent" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })),
    { role: "user" as const, content: input.newUserMessage },
  ];

  const response = await client().messages.create({
    model: env.anthropic.model(),
    system: systemPrompt,
    messages,
    max_tokens: 800,
  });

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Strip markdown code fences if Claude wraps the JSON in ```json ... ```
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const text = fenceMatch ? fenceMatch[1] : rawText.trim();

  let parsed: {
    reply: string;
    extractedFields: Record<string, string | null>;
    classification: Classification;
    classificationReason: string;
    complete: boolean;
  };
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    generation.end({
      output: rawText,
      level: "ERROR",
      statusMessage: "Claude did not return valid JSON",
    });
    throw new Error(`Intake agent returned non-JSON: ${rawText.slice(0, 200)}`);
  }

  const turnIndex = input.history.length + 1;
  // Seed from the configured criteria so custom parameters are captured too.
  const criteriaKeys = new Set(input.criteria.map((c) => c.key));
  const baseFields =
    input.existingFields.length > 0 && input.existingFields.every((f) => criteriaKeys.has(f.key))
      ? input.existingFields
      : fieldsFromCriteria(input.criteria);
  const merged = mergeFields(baseFields, parsed.extractedFields, turnIndex);

  generation.end({
    output: parsed,
    usage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  });

  return {
    reply: parsed.reply,
    extractedFields: merged,
    classification: parsed.classification,
    classificationReason: parsed.classificationReason,
    complete: parsed.complete,
  };
}

// Re-export so other modules can build labels without importing two places.
export { FIELD_LABELS };

const SUMMARY_SYSTEM = `You help a travel sales agent triage WhatsApp lead conversations for Connecting Traveller.

Given a transcript, return STRICT JSON only (no prose, no code fences):
{
  "summary": "one sentence capturing who the lead is and what they want",
  "nextAction": "the single most useful next step for the agent, imperative and specific"
}

Keep both fields under 140 characters. Be concrete, never generic.`;

/**
 * One-sentence summary + suggested next action for a lead conversation.
 * Traced to Langfuse under the "summary" tag. Returns null on failure.
 */
export async function summarizeConversation(args: {
  leadId: string;
  transcript: string;
}): Promise<{ summary: string; nextAction: string } | null> {
  const trace = startTrace({
    name: "lead-summary",
    sessionId: args.leadId,
    userId: args.leadId,
    tags: ["summary"],
  });
  const generation = trace.generation({
    name: "claude-summary",
    model: env.anthropic.model(),
    input: args.transcript,
  });
  try {
    const response = await client().messages.create({
      model: env.anthropic.model(),
      system: SUMMARY_SYSTEM,
      max_tokens: 200,
      messages: [{ role: "user", content: args.transcript }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const parsed = JSON.parse(fence ? fence[1] : text) as {
      summary: string;
      nextAction: string;
    };
    generation.end({
      output: parsed,
      usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
    });
    return parsed;
  } catch (e) {
    generation.end({
      output: e instanceof Error ? e.message : String(e),
      level: "ERROR",
      statusMessage: "summary failed",
    });
    return null;
  }
}

const REENGAGE_SYSTEM = `You write short, warm WhatsApp re-engagement messages for Connecting Traveller, a small-group travel company in India.

You are messaging a past lead who enquired before but did not book, to tell them about a new trip that fits what they wanted.

Rules:
- One short paragraph, conversational, never salesy or robotic.
- Open with their first name.
- Reference what they originally wanted, then the new trip and why it fits.
- End with a soft call to action (offer to hold a spot / share details).
- Use the lead's likely language (English, Hindi, or Hinglish); default English.
- Return ONLY the message text. No preamble, no quotes, no markdown.`;

/**
 * Generate a personalised re-engagement message for one lead + trip.
 * Traced to Langfuse under the "reengagement" tag. Returns null on failure
 * so the caller can fall back to a deterministic template.
 */
export async function personalizeReengagement(args: {
  leadId: string;
  prompt: string;
}): Promise<string | null> {
  const trace = startTrace({
    name: "reengagement-message",
    sessionId: args.leadId,
    userId: args.leadId,
    tags: ["reengagement"],
  });
  const generation = trace.generation({
    name: "claude-reengagement",
    model: env.anthropic.model(),
    input: args.prompt,
  });
  try {
    const response = await client().messages.create({
      model: env.anthropic.model(),
      system: REENGAGE_SYSTEM,
      max_tokens: 300,
      messages: [{ role: "user", content: args.prompt }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    generation.end({
      output: text,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    });
    return text || null;
  } catch (e) {
    generation.end({
      output: e instanceof Error ? e.message : String(e),
      level: "ERROR",
      statusMessage: "reengagement generation failed",
    });
    return null;
  }
}
