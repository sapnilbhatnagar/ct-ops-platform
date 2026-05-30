import "server-only";
import type { ExtractedField, Classification, Message } from "@/lib/types";

export type ConversationSession = {
  sessionId: string;
  airtableRecordId: string | null;
  messages: Message[];
  extractedFields: ExtractedField[];
  classification: Classification;
  complete: boolean;
  lastActivityAt: string;
};

// In-memory store. Lives for the lifetime of the serverless function instance.
// Vercel KV (Upstash Redis) replaces this in Phase 7 for multi-instance deploys.
const store = new Map<string, ConversationSession>();

export function getSession(sessionId: string): ConversationSession | undefined {
  return store.get(sessionId);
}

export function saveSession(session: ConversationSession): void {
  store.set(session.sessionId, session);
}

export function deleteSession(sessionId: string): void {
  store.delete(sessionId);
}
