import { NextRequest, NextResponse } from "next/server";
import { parseInboundWebhook, verifyWebhookSignature } from "@/lib/server/aisensy";
import { handleInboundMessage } from "@/lib/server/intake-handler";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();

  const signature = req.headers.get("x-aisensy-signature") ?? req.headers.get("x-hub-signature-256");
  if (!verifyWebhookSignature(signature, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = parseInboundWebhook(payload);
  if (!event) {
    // Could be a delivery receipt or other non-message event — acknowledge and skip
    return NextResponse.json({ ok: true });
  }

  if (event.type !== "text" || !event.text) {
    // Voice or image: handled in the agent (it will reply asking to type)
    await handleInboundMessage(event.phone, "[non-text message]", event.messageId, event.timestamp);
    return NextResponse.json({ ok: true });
  }

  try {
    await handleInboundMessage(event.phone, event.text, event.messageId, event.timestamp);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[webhook] intake error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
