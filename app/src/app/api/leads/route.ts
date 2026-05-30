import { NextResponse } from "next/server";
import { listLeads } from "@/lib/server/airtable";
import { env } from "@/lib/server/env";
import { MOCK_LEADS } from "@/lib/mock/leads";

export async function GET(): Promise<NextResponse> {
  if (!env.airtable.baseId()) {
    // Airtable not yet configured — serve mock data so the UI still works
    return NextResponse.json(MOCK_LEADS);
  }
  try {
    const leads = await listLeads();
    return NextResponse.json(leads);
  } catch (e) {
    console.error("[/api/leads] listLeads error:", e);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
