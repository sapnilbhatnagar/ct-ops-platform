import { NextRequest, NextResponse } from "next/server";
import { buildMatches } from "@/lib/server/reengagement";
import type { Trip } from "@/lib/trip-matching";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let trip: Trip;
  try {
    trip = (await req.json()) as Trip;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!trip?.destination || !trip?.pricePerPerson) {
    return NextResponse.json({ error: "destination and pricePerPerson are required" }, { status: 422 });
  }
  try {
    const matches = await buildMatches(trip);
    return NextResponse.json(matches);
  } catch (e) {
    console.error("[/api/trips/match]", e);
    return NextResponse.json({ error: "Match failed" }, { status: 500 });
  }
}
