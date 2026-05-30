import "server-only";
import { Langfuse } from "langfuse";
import { env } from "./env";

let _client: Langfuse | null = null;

function client(): Langfuse {
  if (_client) return _client;
  _client = new Langfuse({
    publicKey: env.langfuse.publicKey(),
    secretKey: env.langfuse.secretKey(),
    baseUrl: env.langfuse.host(),
  });
  return _client;
}

/**
 * Start a session-scoped trace for a single conversation turn.
 * sessionId and userId are both the phone hash — sessionId groups turns
 * into a conversation view; userId enables per-lead cost attribution.
 * The "intake" tag lets you filter all intake traces in the Langfuse UI.
 * Never pass raw phone numbers.
 */
export function startTurnTrace(args: {
  sessionId: string;
  name: string;
  metadata?: Record<string, unknown>;
}) {
  return client().trace({
    name: args.name,
    sessionId: args.sessionId,
    userId: args.sessionId,
    tags: ["intake"],
    metadata: args.metadata,
  });
}

/**
 * Ensures buffered events are flushed before serverless function shutdown.
 * Call at the end of every API route that uses Langfuse.
 */
export async function flushLangfuse(): Promise<void> {
  if (_client) {
    await _client.flushAsync();
  }
}
