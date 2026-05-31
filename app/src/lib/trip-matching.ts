import type { Lead, Classification, Campaign } from "./types";
import { fieldValue } from "./leads-view";

export type Trip = {
  destination: string;
  startDate: string;
  endDate: string;
  pricePerPerson: number;
  seats: number;
  highlights: string;
  offerDeadline: string;
};

export type MatchedLead = {
  lead: Lead;
  reason: string;
};

/** A matched lead with its drafted message, as returned by /api/trips/match. */
export type ReengagementMatch = {
  id: string;
  contactName: string | null;
  phoneMasked: string;
  classification: Classification;
  reason: string;
  message: string;
  messageSource: "model" | "template";
};

function parseAmount(raw: string | null): number {
  if (!raw) return 0;
  const m = raw.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}

const STOP_WORDS = new Set(["and", "the", "for", "with", "near", "around", "trip"]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 4 && !STOP_WORDS.has(t));
}

function destinationMatches(leadDest: string | null, tripDest: string): boolean {
  if (!leadDest) return false;
  const a = new Set(tokens(leadDest));
  return tokens(tripDest).some((t) => a.has(t));
}

function budgetFits(leadBudget: string | null, tripPrice: number): boolean {
  const amount = parseAmount(leadBudget);
  return amount > 0 && amount >= tripPrice * 0.8;
}

const HEAT: Record<Classification, number> = { hot: 3, warm: 2, cold: 1, unclassified: 0 };

export function matchLeadsToTrip(leads: Lead[], trip: Trip): MatchedLead[] {
  const matched: MatchedLead[] = [];
  for (const lead of leads) {
    const dest = fieldValue(lead, "destination");
    const budget = fieldValue(lead, "budget");
    const destOk = destinationMatches(dest, trip.destination);
    const budgetOk = budgetFits(budget, trip.pricePerPerson);
    if (!destOk && !budgetOk) continue;

    let reason: string;
    if (destOk && budgetOk) {
      reason = `Asked about ${dest}; budget ${budget} fits this trip`;
    } else if (destOk) {
      reason = `Asked about ${dest}`;
    } else {
      reason = `Budget ${budget} fits this ₹${trip.pricePerPerson.toLocaleString("en-IN")} trip`;
    }
    matched.push({ lead, reason });
  }
  // Hottest leads first, then most recently active
  return matched.sort((a, b) => {
    const heat = HEAT[b.lead.classification] - HEAT[a.lead.classification];
    if (heat !== 0) return heat;
    return new Date(b.lead.lastActivityAt).getTime() - new Date(a.lead.lastActivityAt).getTime();
  });
}

export function classificationBreakdown(matched: MatchedLead[]): Record<Classification, number> {
  const counts: Record<Classification, number> = { hot: 0, warm: 0, cold: 0, unclassified: 0 };
  for (const m of matched) counts[m.lead.classification] += 1;
  return counts;
}

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return `${start} – ${end}`;
  return `${s.toLocaleDateString("en-IN", opts)} – ${e.toLocaleDateString("en-IN", { ...opts, year: "numeric" })}`;
}

export function generateMessage(lead: Lead, trip: Trip): string {
  const name = lead.contactName?.split(" ")[0] ?? "there";
  const dates = formatDateRange(trip.startDate, trip.endDate);
  const price = `₹${trip.pricePerPerson.toLocaleString("en-IN")}`;
  const highlight = trip.highlights.split(/[.,]/)[0]?.trim();
  return (
    `Hi ${name}! 🌟 We just opened a new ${trip.destination} trip (${dates}) at ${price}/person. ` +
    (highlight ? `Think ${highlight.toLowerCase()} and more. ` : "") +
    `Only ${trip.seats} seats — book by ${new Date(trip.offerDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}. ` +
    `Want me to hold a spot for you?`
  );
}

/** Adapt a campaign record into the Trip shape the matcher and message use. */
export function campaignToTrip(c: Campaign): Trip {
  return {
    destination: c.destination,
    startDate: c.startDate ?? "",
    endDate: c.endDate ?? "",
    pricePerPerson: c.pricePerPerson ?? 0,
    seats: c.seatsTotal != null ? Math.max(0, c.seatsTotal - c.seatsBooked) : 0,
    highlights: c.inclusions.join(", "),
    offerDeadline: c.startDate ?? "",
  };
}
