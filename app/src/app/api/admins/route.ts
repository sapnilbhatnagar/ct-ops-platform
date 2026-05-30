import { NextRequest, NextResponse } from "next/server";
import { listAdmins, createAdmin, findAdminByEmail } from "@/lib/server/airtable";
import { env } from "@/lib/server/env";
import { MOCK_ADMINS } from "@/lib/mock/admins";

export async function GET(): Promise<NextResponse> {
  if (!env.airtable.baseId()) {
    return NextResponse.json(MOCK_ADMINS);
  }
  try {
    const admins = await listAdmins();
    return NextResponse.json(admins);
  } catch (e) {
    console.error("[/api/admins] listAdmins error:", e);
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!env.airtable.baseId()) {
    return NextResponse.json(
      { error: "Airtable not configured — add AIRTABLE_BASE_ID to .env.local" },
      { status: 503 },
    );
  }

  let body: { name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email } = body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 422 });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "valid email is required" }, { status: 422 });
  }

  const existing = await findAdminByEmail(email.trim().toLowerCase());
  if (existing) {
    return NextResponse.json({ error: "An admin with that email already exists" }, { status: 409 });
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "??";

  const palette = ["#C8553D", "#5A8F5A", "#9DB4C0", "#E8A87C", "#6B6B6B"];
  // deterministic color from email so it's stable across reloads
  const colorIndex = email.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % palette.length;
  const color = palette[colorIndex];

  try {
    const admin = await createAdmin({ name: name.trim(), email: email.trim().toLowerCase(), initials, color });
    return NextResponse.json(admin, { status: 201 });
  } catch (e) {
    console.error("[/api/admins POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
