import { NextRequest, NextResponse } from "next/server";
import { deactivateAdmin } from "@/lib/server/airtable";
import { env } from "@/lib/server/env";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  if (!env.airtable.baseId()) {
    return NextResponse.json({ ok: true, note: "mock mode — change not persisted" });
  }
  try {
    await deactivateAdmin(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/admins/[id] DELETE]", e);
    return NextResponse.json({ error: "Deactivate failed" }, { status: 500 });
  }
}
