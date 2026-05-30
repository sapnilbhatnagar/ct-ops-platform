import { describe, it, expect } from "vitest";
import {
  matchLeadsToTrip,
  generateMessage,
  classificationBreakdown,
  type Trip,
} from "./trip-matching";
import type { Lead } from "./types";

function lead(id: string, dest: string, budget: string, cls: Lead["classification"] = "warm"): Lead {
  return {
    id,
    contactName: id === "anon" ? null : id[0].toUpperCase() + id.slice(1),
    phoneMasked: "+91 90••• ••000",
    language: "en",
    source: "meta_ad",
    status: "in_progress",
    classification: cls,
    classificationSource: "model",
    assignedToId: null,
    extractedFields: [
      { key: "name", label: "Name", value: id, confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "destination", label: "Destination", value: dest, confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "travel_dates", label: "Travel dates", value: "flexible", confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "group_size", label: "Group size", value: "2", confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "budget", label: "Budget", value: budget, confidence: 0.9, extractedAtMessageIndex: 1 },
    ],
    messages: [],
    startedAt: "2026-05-01T00:00:00Z",
    lastActivityAt: "2026-05-01T00:00:00Z",
  };
}

const trip: Trip = {
  destination: "Rajasthan",
  startDate: "2026-10-04",
  endDate: "2026-10-10",
  pricePerPerson: 20000,
  seats: 12,
  highlights: "Forts, desert safari, palace stay",
  offerDeadline: "2026-09-15",
};

describe("matchLeadsToTrip", () => {
  it("matches a lead whose destination shares a token with the trip", () => {
    const leads = [lead("priya", "Jaipur and Udaipur, Rajasthan", "25000")];
    const matched = matchLeadsToTrip(leads, trip);
    expect(matched).toHaveLength(1);
    expect(matched[0].lead.id).toBe("priya");
    expect(matched[0].reason.toLowerCase()).toContain("rajasthan");
  });

  it("matches a lead whose budget fits even if destination differs", () => {
    const leads = [lead("rahul", "Kerala", "30000")];
    const matched = matchLeadsToTrip(leads, trip);
    expect(matched).toHaveLength(1);
    expect(matched[0].reason.toLowerCase()).toContain("budget");
  });

  it("excludes a lead with neither destination nor budget fit", () => {
    const leads = [lead("sara", "Kerala", "5000")];
    expect(matchLeadsToTrip(leads, trip)).toHaveLength(0);
  });

  it("returns an empty array when no leads match", () => {
    expect(matchLeadsToTrip([], trip)).toEqual([]);
  });

  it("ranks hot leads ahead of warm and cold", () => {
    const leads = [
      lead("coldlead", "Rajasthan", "25000", "cold"),
      lead("hotlead", "Rajasthan", "25000", "hot"),
      lead("warmlead", "Rajasthan", "25000", "warm"),
    ];
    const matched = matchLeadsToTrip(leads, trip);
    expect(matched.map((m) => m.lead.id)).toEqual(["hotlead", "warmlead", "coldlead"]);
  });
});

describe("generateMessage", () => {
  it("interpolates the lead name and trip destination", () => {
    const msg = generateMessage(lead("priya", "Rajasthan", "25000"), trip);
    expect(msg).toContain("Priya");
    expect(msg).toContain("Rajasthan");
  });

  it("falls back to a generic greeting when the lead has no name", () => {
    const msg = generateMessage(lead("anon", "Rajasthan", "25000"), trip);
    expect(msg.toLowerCase()).toContain("there");
  });
});

describe("classificationBreakdown", () => {
  it("counts matched leads by classification", () => {
    const leads = [
      lead("a", "Rajasthan", "25000", "hot"),
      lead("b", "Rajasthan", "25000", "hot"),
      lead("c", "Rajasthan", "25000", "warm"),
    ];
    const breakdown = classificationBreakdown(matchLeadsToTrip(leads, trip));
    expect(breakdown.hot).toBe(2);
    expect(breakdown.warm).toBe(1);
    expect(breakdown.cold).toBe(0);
  });
});
