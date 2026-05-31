import { NextRequest, NextResponse } from "next/server";
import { updateLead } from "@/lib/server/airtable";
import { env } from "@/lib/server/env";
import { MOCK_LEADS } from "@/lib/mock/leads";
import type { Classification, ClassificationSource, BookingStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  if (!env.airtable.baseId()) {
    const lead = MOCK_LEADS.find((l) => l.id === id);
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(lead);
  }
  // Full Airtable GET-by-id added in Phase 2b when we build the leads list page
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  if (!env.airtable.baseId()) {
    return NextResponse.json({ ok: true, note: "mock mode — change not persisted" });
  }

  let body: {
    classification?: Classification;
    classificationSource?: ClassificationSource;
    classificationReason?: string;
    assignedToId?: string | null;
    campaignId?: string | null;
    bookingStatus?: BookingStatus;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await updateLead(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/leads/[id] PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
