import { NextRequest, NextResponse } from "next/server";
import { buildCampaignMatches } from "@/lib/server/reengagement";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    return NextResponse.json(await buildCampaignMatches(id));
  } catch (e) {
    console.error("[/api/campaigns/[id]/match]", e);
    return NextResponse.json({ error: "Match failed" }, { status: 500 });
  }
}
