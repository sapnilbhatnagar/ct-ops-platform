"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Classification, Admin } from "@/lib/types";
import { AdminAvatar } from "@/components/intake/admin-avatar";
import { findAdmin } from "@/lib/hooks/use-admins";
import type { LeadsFilter } from "@/lib/leads-view";

const CLASS_CHIPS: { value: Classification; label: string }[] = [
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
  { value: "unclassified", label: "Qualifying" },
];

export function LeadsFilterBar({
  filter,
  onChange,
  destinations,
  admins,
}: {
  filter: LeadsFilter;
  onChange: (next: LeadsFilter) => void;
  destinations: string[];
  admins: Admin[];
}) {
  function toggleClassification(c: Classification) {
    const next = new Set(filter.classifications);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    onChange({ ...filter, classifications: next });
  }

  const owner = findAdmin(admins, filter.assignee === "all" || filter.assignee === "unassigned" ? null : filter.assignee);

  return (
    <div
      data-testid="leads-filter-bar"
      className="flex flex-wrap items-center gap-3 border-b border-rule px-8 py-3"
    >
      <div className="flex items-center gap-1">
        {CLASS_CHIPS.map((chip) => {
          const active = filter.classifications.has(chip.value);
          return (
            <button
              key={chip.value}
              type="button"
              data-testid={`leads-class-${chip.value}`}
              data-active={active}
              onClick={() => toggleClassification(chip.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                active ? "bg-accent text-white" : "border border-rule bg-paper text-mute hover:text-ink",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <select
        data-testid="leads-destination"
        value={filter.destination}
        onChange={(e) => onChange({ ...filter, destination: e.target.value })}
        className="rounded-md border border-rule bg-paper px-2.5 py-1.5 text-[12px] text-ink focus:outline-none"
      >
        <option value="all">All destinations</option>
        {destinations.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        data-testid="leads-assignee"
        value={filter.assignee}
        onChange={(e) => onChange({ ...filter, assignee: e.target.value })}
        className="rounded-md border border-rule bg-paper px-2.5 py-1.5 text-[12px] text-ink focus:outline-none"
      >
        <option value="all">Everyone</option>
        <option value="unassigned">Unassigned</option>
        {admins.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      {owner ? <AdminAvatar admin={owner} size="xs" /> : null}

      <div className="relative ml-auto">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-mute" />
        <input
          type="search"
          data-testid="leads-search"
          value={filter.search}
          onChange={(e) => onChange({ ...filter, search: e.target.value })}
          placeholder="Search name or destination"
          className="w-56 rounded-md border border-rule bg-paper py-1.5 pl-8 pr-3 text-[12px] text-ink placeholder:text-mute/60 focus:outline-none"
        />
      </div>
    </div>
  );
}
