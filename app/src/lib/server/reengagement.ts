import "server-only";
import { listLeads, getCampaign } from "./airtable";
import { personalizeReengagement } from "./anthropic";
import { sendText } from "./aisensy";
import { flushLangfuse } from "./langfuse";
import { env } from "./env";
import {
  matchLeadsToTrip,
  generateMessage,
  campaignToTrip,
  type Trip,
  type ReengagementMatch,
} from "@/lib/trip-matching";
import { fieldValue } from "@/lib/leads-view";
import { MOCK_LEADS } from "@/lib/mock/leads";
import type { Lead } from "@/lib/types";

export type { ReengagementMatch };
export type BroadcastResult = { sent: number; failed: number };

async function loadLeads(): Promise<Lead[]> {
  // Falls back to mock leads when Airtable is not yet configured,
  // mirroring the /api/leads route.
  return env.airtable.baseId() ? listLeads() : MOCK_LEADS;
}

function promptFor(lead: Lead, trip: Trip): string {
  return [
    `Lead name: ${lead.contactName ?? "unknown"}`,
    `Originally asked about: ${fieldValue(lead, "destination") ?? "n/a"}`,
    `Their budget: ${fieldValue(lead, "budget") ?? "n/a"}`,
    `Their group size: ${fieldValue(lead, "group_size") ?? "n/a"}`,
    ``,
    `New trip to offer:`,
    `Destination: ${trip.destination}`,
    `Dates: ${trip.startDate} to ${trip.endDate}`,
    `Price: ₹${trip.pricePerPerson} per person`,
    `Seats: ${trip.seats}`,
    `Book by: ${trip.offerDeadline}`,
    `Highlights: ${trip.highlights || "n/a"}`,
  ].join("\n");
}

/**
 * Match every stored lead against the trip and draft a personalised message
 * per match (Claude, traced to Langfuse; deterministic template on failure).
 */
export async function buildMatches(trip: Trip): Promise<ReengagementMatch[]> {
  const leads = await loadLeads();
  const matched = matchLeadsToTrip(leads, trip);

  const result = await Promise.all(
    matched.map(async ({ lead, reason }) => {
      const ai = await personalizeReengagement({ leadId: lead.id, prompt: promptFor(lead, trip) });
      return {
        id: lead.id,
        contactName: lead.contactName,
        phoneMasked: lead.phoneMasked,
        classification: lead.classification,
        reason,
        message: ai ?? generateMessage(lead, trip),
        messageSource: (ai ? "model" : "template") as ReengagementMatch["messageSource"],
      };
    }),
  );

  await flushLangfuse();
  return result;
}

/** Re-engagement matches for a campaign: leads whose destination/budget fit its trip. */
export async function buildCampaignMatches(campaignId: string): Promise<ReengagementMatch[]> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) return [];
  return buildMatches(campaignToTrip(campaign));
}

/**
 * Send the drafted messages. In sim mode this logs to the console and always
 * succeeds.
 *
 * NOTE: real AISensy sending needs the raw phone number, which we deliberately
 * do not store (only the SHA-256 hash + a masked display string). Resolving
 * this is part of the AISensy wiring: either store the raw number, or send via
 * an AISensy contact reference. For now we pass the masked string so sim mode
 * works end to end.
 */
export async function runBroadcast(matches: ReengagementMatch[]): Promise<BroadcastResult> {
  let sent = 0;
  let failed = 0;
  for (const m of matches) {
    const res = await sendText(m.phoneMasked, m.message);
    if (res.ok) sent += 1;
    else failed += 1;
  }
  return { sent, failed };
}
