import { NextRequest, NextResponse } from "next/server";
import {
  listCampaigns,
  createCampaign,
  updateCampaignCriteria,
  setActiveCampaign,
} from "@/lib/server/airtable";
import { env } from "@/lib/server/env";
import { DEFAULT_CRITERIA, type QualifyingCriterion } from "@/lib/types";

function seed() {
  return {
    campaigns: [{ id: "campaign_default", name: "Default campaign", criteria: DEFAULT_CRITERIA }],
    activeId: "campaign_default",
  };
}

export async function GET(): Promise<NextResponse> {
  if (!env.airtable.baseId()) {
    return NextResponse.json(seed());
  }
  try {
    return NextResponse.json(await listCampaigns());
  } catch (e) {
    console.error("[/api/campaigns GET]", e);
    return NextResponse.json(seed());
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!env.airtable.baseId()) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 503 });
  }
  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 422 });
  }
  try {
    return NextResponse.json(await createCampaign(body.name.trim()), { status: 201 });
  } catch (e) {
    console.error("[/api/campaigns POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  if (!env.airtable.baseId()) {
    return NextResponse.json({ ok: true, note: "no-op (Airtable not configured)" });
  }
  let body: { id?: string; criteria?: QualifyingCriterion[]; setActive?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 422 });
  }
  try {
    if (body.setActive) await setActiveCampaign(body.id);
    if (body.criteria) await updateCampaignCriteria(body.id, body.criteria);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/campaigns PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
