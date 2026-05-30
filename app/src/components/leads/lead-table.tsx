"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead, Admin } from "@/lib/types";
import { ClassificationBadge } from "@/components/intake/classification-badge";
import { AdminAvatar } from "@/components/intake/admin-avatar";
import { findAdmin } from "@/lib/hooks/use-admins";
import { fieldValue, type SortKey, type SortDir } from "@/lib/leads-view";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

const COLUMNS: { key: SortKey | null; label: string; testKey?: SortKey }[] = [
  { key: "name", label: "Lead", testKey: "name" },
  { key: null, label: "Phone" },
  { key: "destination", label: "Destination", testKey: "destination" },
  { key: null, label: "Dates" },
  { key: "groupSize", label: "Group", testKey: "groupSize" },
  { key: "budget", label: "Budget", testKey: "budget" },
  { key: "classification", label: "Status", testKey: "classification" },
  { key: null, label: "Owner" },
  { key: "lastActivity", label: "Last activity", testKey: "lastActivity" },
];

export function LeadTable({
  leads,
  admins,
  sort,
  onSort,
  onSelect,
}: {
  leads: Lead[];
  admins: Admin[];
  sort: { key: SortKey; dir: SortDir };
  onSort: (key: SortKey) => void;
  onSelect: (id: string) => void;
}) {
  if (leads.length === 0) {
    return (
      <div
        data-testid="lead-table-empty"
        className="flex flex-1 items-center justify-center px-8 py-20 text-[13px] text-mute"
      >
        No leads match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" data-testid="lead-table">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-rule">
            {COLUMNS.map((col) => {
              const sortable = col.key !== null;
              const active = sort.key === col.key;
              return (
                <th
                  key={col.label}
                  scope="col"
                  className="px-4 py-2.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-mute"
                >
                  {sortable ? (
                    <button
                      type="button"
                      data-testid={`sort-${col.testKey}`}
                      data-active={active}
                      onClick={() => onSort(col.key!)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-ink"
                    >
                      {col.label}
                      {active ? (
                        sort.dir === "asc" ? (
                          <ChevronUp className="size-3" />
                        ) : (
                          <ChevronDown className="size-3" />
                        )
                      ) : null}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => {
            const owner = findAdmin(admins, l.assignedToId);
            return (
              <tr
                key={l.id}
                data-testid={`lead-row-${l.id}`}
                onClick={() => onSelect(l.id)}
                className="cursor-pointer border-b border-rule/60 transition-colors hover:bg-rule/20"
              >
                <td className="px-4 py-3 text-[13.5px] text-ink">
                  {l.contactName ?? <span className="text-mute">Unnamed lead</span>}
                </td>
                <td className="px-4 py-3 text-[12.5px] tabular-nums text-mute">{l.phoneMasked}</td>
                <td className="px-4 py-3 text-[13px] text-ink">
                  {fieldValue(l, "destination") ?? <span className="text-mute/60">—</span>}
                </td>
                <td className="px-4 py-3 text-[13px] text-mute">
                  {fieldValue(l, "travel_dates") ?? "—"}
                </td>
                <td className="px-4 py-3 text-[13px] tabular-nums text-mute">
                  {fieldValue(l, "group_size") ?? "—"}
                </td>
                <td className="px-4 py-3 text-[13px] tabular-nums text-mute">
                  {fieldValue(l, "budget") ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <ClassificationBadge value={l.classification} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn("inline-flex items-center gap-1.5 text-[12px]", owner ? "text-ink" : "text-mute")}
                    title={owner ? owner.name : "Unassigned"}
                  >
                    <AdminAvatar admin={owner} size="xs" />
                    {owner ? owner.name.split(" ")[0] : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[12px] whitespace-nowrap text-mute">
                  {relativeTime(l.lastActivityAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
