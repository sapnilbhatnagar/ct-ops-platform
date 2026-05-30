import { NextRequest, NextResponse } from "next/server";
import { handleInboundMessage } from "@/lib/server/intake-handler";
import { env } from "@/lib/server/env";

/**
 * Development-only endpoint. Mimics an inbound AISensy webhook so you can
 * test the full intake flow (Claude agent + Langfuse tracing + Airtable)
 * without a real WhatsApp connection.
 *
 * POST /api/dev/simulate-message
 * Body: { phone: string, text: string }
 *
 * Only available when AISENSY_SIM_MODE=true.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!env.aisensy.simMode()) {
    return NextResponse.json({ error: "Sim mode is disabled" }, { status: 403 });
  }

  let body: { phone?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { phone, text } = body;
  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "phone is required" }, { status: 422 });
  }
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 422 });
  }

  const messageId = `sim_${Date.now()}`;
  const timestamp = new Date().toISOString();

  try {
    const result = await handleInboundMessage(phone, text, messageId, timestamp);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[simulate-message] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
