import { NextRequest, NextResponse } from "next/server";
import { runBroadcast, type ReengagementMatch } from "@/lib/server/reengagement";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { matches?: ReengagementMatch[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.matches) || body.matches.length === 0) {
    return NextResponse.json({ error: "matches is required" }, { status: 422 });
  }
  try {
    const result = await runBroadcast(body.matches);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[/api/trips/broadcast]", e);
    return NextResponse.json({ error: "Broadcast failed" }, { status: 500 });
  }
}
