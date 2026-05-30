import { describe, it, expect } from "vitest";
import {
  filterLeads,
  sortLeads,
  destinationOptions,
  fieldValue,
  emptyFilter,
  type LeadsFilter,
} from "./leads-view";
import type { Lead, Classification } from "./types";

function lead(partial: Partial<Lead> & { id: string }): Lead {
  return {
    id: partial.id,
    contactName: partial.contactName ?? "Test Lead",
    phoneMasked: partial.phoneMasked ?? "+91 90••• ••000",
    language: "en",
    source: "meta_ad",
    status: partial.status ?? "in_progress",
    classification: partial.classification ?? "warm",
    classificationSource: "model",
    assignedToId: partial.assignedToId ?? null,
    extractedFields: partial.extractedFields ?? [
      { key: "name", label: "Name", value: partial.contactName ?? "Test Lead", confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "destination", label: "Destination", value: partial.destination ?? "Goa", confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "travel_dates", label: "Travel dates", value: "December", confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "group_size", label: "Group size", value: partial.groupSize ?? "2", confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "budget", label: "Budget", value: partial.budget ?? "20000", confidence: 0.9, extractedAtMessageIndex: 1 },
    ],
    messages: [],
    startedAt: partial.startedAt ?? "2026-05-01T00:00:00.000Z",
    lastActivityAt: partial.lastActivityAt ?? "2026-05-01T00:00:00.000Z",
  } as Lead & { destination?: string; groupSize?: string; budget?: string };
}

const leads: Lead[] = [
  lead({ id: "a", contactName: "Anjali", classification: "hot", lastActivityAt: "2026-05-10T00:00:00Z" }),
  lead({ id: "b", contactName: "Bharat", classification: "cold", lastActivityAt: "2026-05-12T00:00:00Z" }),
  lead({ id: "c", contactName: "Chetan", classification: "warm", lastActivityAt: "2026-05-11T00:00:00Z", assignedToId: "admin_1" }),
];

describe("filterLeads", () => {
  it("returns all leads when the filter is empty", () => {
    expect(filterLeads(leads, emptyFilter())).toHaveLength(3);
  });

  it("filters by a single classification", () => {
    const f: LeadsFilter = { ...emptyFilter(), classifications: new Set<Classification>(["hot"]) };
    const result = filterLeads(leads, f);
    expect(result.map((l) => l.id)).toEqual(["a"]);
  });

  it("filters by multiple classifications (multi-select)", () => {
    const f: LeadsFilter = { ...emptyFilter(), classifications: new Set<Classification>(["hot", "cold"]) };
    expect(filterLeads(leads, f).map((l) => l.id).sort()).toEqual(["a", "b"]);
  });

  it("filters by assignee (unassigned)", () => {
    const f: LeadsFilter = { ...emptyFilter(), assignee: "unassigned" };
    expect(filterLeads(leads, f).map((l) => l.id).sort()).toEqual(["a", "b"]);
  });

  it("filters by a specific assignee id", () => {
    const f: LeadsFilter = { ...emptyFilter(), assignee: "admin_1" };
    expect(filterLeads(leads, f).map((l) => l.id)).toEqual(["c"]);
  });

  it("searches across name and destination case-insensitively", () => {
    const f: LeadsFilter = { ...emptyFilter(), search: "anj" };
    expect(filterLeads(leads, f).map((l) => l.id)).toEqual(["a"]);
  });

  it("composes filters together", () => {
    const f: LeadsFilter = {
      ...emptyFilter(),
      classifications: new Set<Classification>(["hot", "warm"]),
      assignee: "unassigned",
    };
    expect(filterLeads(leads, f).map((l) => l.id)).toEqual(["a"]);
  });
});

describe("sortLeads", () => {
  it("sorts by last activity descending", () => {
    expect(sortLeads(leads, "lastActivity", "desc").map((l) => l.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by name ascending", () => {
    expect(sortLeads(leads, "name", "asc").map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("sorts by classification heat (hot first when desc)", () => {
    expect(sortLeads(leads, "classification", "desc").map((l) => l.id)).toEqual(["a", "c", "b"]);
  });

  it("does not mutate the input array", () => {
    const copy = [...leads];
    sortLeads(leads, "name", "asc");
    expect(leads).toEqual(copy);
  });
});

describe("destinationOptions", () => {
  it("returns unique destinations sorted", () => {
    const mixed = [
      lead({ id: "x", destination: "Goa" }),
      lead({ id: "y", destination: "Kerala" }),
      lead({ id: "z", destination: "Goa" }),
    ];
    expect(destinationOptions(mixed)).toEqual(["Goa", "Kerala"]);
  });
});

describe("fieldValue", () => {
  it("reads an extracted field by key", () => {
    expect(fieldValue(leads[0], "destination")).toBe("Goa");
  });

  it("returns null for a missing field", () => {
    const bare = { ...leads[0], extractedFields: [] };
    expect(fieldValue(bare, "budget")).toBeNull();
  });
});
