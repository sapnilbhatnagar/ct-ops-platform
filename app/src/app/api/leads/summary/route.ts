import { NextRequest, NextResponse } from "next/server";
import { summarizeConversation } from "@/lib/server/anthropic";
import { flushLangfuse } from "@/lib/server/langfuse";
import type { Message } from "@/lib/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { leadId?: string; messages?: Message[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = body.messages ?? [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "messages is required" }, { status: 422 });
  }

  const transcript = messages
    .map((m) => `${m.role === "agent" ? "Agent" : "Lead"}: ${m.content}`)
    .join("\n");

  try {
    const result = await summarizeConversation({
      leadId: body.leadId ?? "unknown",
      transcript,
    });
    await flushLangfuse();
    if (!result) {
      return NextResponse.json({ error: "Could not summarise" }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("[/api/leads/summary]", e);
    return NextResponse.json({ error: "Summary failed" }, { status: 500 });
  }
}
