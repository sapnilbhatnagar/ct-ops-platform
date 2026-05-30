import type { Lead, Classification, FieldKey } from "./types";
import type { AssigneeFilter } from "@/components/intake/filter-bar";

export type SortKey =
  | "name"
  | "destination"
  | "classification"
  | "groupSize"
  | "budget"
  | "lastActivity";

export type SortDir = "asc" | "desc";

export type LeadsFilter = {
  classifications: Set<Classification>; // empty = all
  destination: string | "all";
  assignee: AssigneeFilter;
  search: string;
};

export function emptyFilter(): LeadsFilter {
  return {
    classifications: new Set<Classification>(),
    destination: "all",
    assignee: "all",
    search: "",
  };
}

export function fieldValue(lead: Lead, key: FieldKey): string | null {
  return lead.extractedFields.find((f) => f.key === key)?.value ?? null;
}

/** Parse the first number out of a freeform string like "₹25,000 per person" → 25000. */
function numericValue(raw: string | null): number {
  if (!raw) return 0;
  const match = raw.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

const HEAT: Record<Classification, number> = {
  hot: 3,
  warm: 2,
  cold: 1,
  unclassified: 0,
};

export function filterLeads(leads: Lead[], filter: LeadsFilter): Lead[] {
  const search = filter.search.trim().toLowerCase();
  return leads.filter((l) => {
    if (filter.classifications.size > 0 && !filter.classifications.has(l.classification)) {
      return false;
    }
    if (filter.destination !== "all" && fieldValue(l, "destination") !== filter.destination) {
      return false;
    }
    if (filter.assignee === "unassigned" && l.assignedToId !== null) return false;
    if (filter.assignee !== "all" && filter.assignee !== "unassigned" && l.assignedToId !== filter.assignee) {
      return false;
    }
    if (search) {
      const haystack = `${l.contactName ?? ""} ${fieldValue(l, "destination") ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function sortLeads(leads: Lead[], key: SortKey, dir: SortDir): Lead[] {
  const factor = dir === "asc" ? 1 : -1;
  const compare = (a: Lead, b: Lead): number => {
    switch (key) {
      case "name":
        return (a.contactName ?? "").localeCompare(b.contactName ?? "");
      case "destination":
        return (fieldValue(a, "destination") ?? "").localeCompare(fieldValue(b, "destination") ?? "");
      case "classification":
        return HEAT[a.classification] - HEAT[b.classification];
      case "groupSize":
        return numericValue(fieldValue(a, "group_size")) - numericValue(fieldValue(b, "group_size"));
      case "budget":
        return numericValue(fieldValue(a, "budget")) - numericValue(fieldValue(b, "budget"));
      case "lastActivity":
        return new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime();
    }
  };
  return [...leads].sort((a, b) => factor * compare(a, b));
}

export function destinationOptions(leads: Lead[]): string[] {
  const set = new Set<string>();
  for (const l of leads) {
    const d = fieldValue(l, "destination");
    if (d) set.add(d);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
