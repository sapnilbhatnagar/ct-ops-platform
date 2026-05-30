/**
 * Server-side env reader. Each accessor throws if the env var is missing,
 * so a misconfigured deploy fails on the first request rather than silently
 * sending undefined values to Claude / AISensy.
 *
 * Use the accessor functions, not direct process.env reads, so tests can
 * stub by setting process.env before requiring the module under test.
 */

function required(name: string): string {
  const val = process.env[name];
  if (!val || val.trim() === "") {
    throw new Error(
      `Missing required env var: ${name}. See app/env.example for the full list.`,
    );
  }
  return val;
}

function optional(name: string, fallback: string): string {
  const val = process.env[name];
  return val && val.trim() !== "" ? val : fallback;
}

export const env = {
  anthropic: {
    apiKey: () => required("ANTHROPIC_API_KEY"),
    model: () => optional("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
  },
  aisensy: {
    // When AISENSY_SIM_MODE=true, apiKey and agentPhone are not required.
    // All outbound calls are logged to console; no real WhatsApp messages sent.
    simMode: () => optional("AISENSY_SIM_MODE", "false") === "true",
    apiKey: () => required("AISENSY_API_KEY"),
    webhookSecret: () => optional("AISENSY_WEBHOOK_SECRET", "dev-sim-secret"),
    agentPhone: () => required("AISENSY_AGENT_PHONE"),
    templateHotLead: () => optional("AISENSY_TEMPLATE_HOT_LEAD", "hot_lead_notification_v1"),
    templateGreeting: () => optional("AISENSY_TEMPLATE_GREETING", "intake_greeting_v1"),
  },
  airtable: {
    apiKey: () => required("AIRTABLE_API_KEY"),
    // Optional during development: when absent, API routes fall back to mock data.
    baseId: () => optional("AIRTABLE_BASE_ID", ""),
    leadsTable: () => optional("AIRTABLE_LEADS_TABLE", "Leads"),
    adminsTable: () => optional("AIRTABLE_ADMINS_TABLE", "Admins"),
    tripsTable: () => optional("AIRTABLE_TRIPS_TABLE", "Trips"),
  },
  langfuse: {
    publicKey: () => required("LANGFUSE_PUBLIC_KEY"),
    secretKey: () => required("LANGFUSE_SECRET_KEY"),
    host: () => optional("LANGFUSE_HOST", "https://cloud.langfuse.com"),
  },
};
