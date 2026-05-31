import { NextRequest, NextResponse } from "next/server";
import { runBroadcast } from "@/lib/server/reengagement";
import type { ReengagementMatch } from "@/lib/trip-matching";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let matches: ReengagementMatch[];
  try {
    matches = ((await req.json()) as { matches?: ReengagementMatch[] }).matches ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    return NextResponse.json(await runBroadcast(matches));
  } catch (e) {
    console.error("[/api/campaigns/[id]/broadcast]", e);
    return NextResponse.json({ error: "Broadcast failed" }, { status: 500 });
  }
}
