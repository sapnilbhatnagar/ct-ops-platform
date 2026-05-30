"use client";

import { cn } from "@/lib/utils";
import type { Classification, Admin } from "@/lib/types";
import { AdminAvatar } from "./admin-avatar";

const CLASS_OPTIONS: { value: Classification | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
  { value: "unclassified", label: "Qualifying" },
];

export type AssigneeFilter = "all" | "unassigned" | string;

export function FilterBar({
  classFilter,
  onClassFilter,
  assigneeFilter,
  onAssigneeFilter,
  admins,
}: {
  classFilter: Classification | "all";
  onClassFilter: (v: Classification | "all") => void;
  assigneeFilter: AssigneeFilter;
  onAssigneeFilter: (v: AssigneeFilter) => void;
  admins: Admin[];
}) {
  return (
    <div className="space-y-2 px-4 py-2.5" data-testid="filter-bar">
      <div className="flex flex-wrap gap-1">
        {CLASS_OPTIONS.map((opt) => {
          const active = classFilter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`class-filter-${opt.value}`}
              data-active={active}
              onClick={() => onClassFilter(opt.value)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                active
                  ? "bg-accent text-white"
                  : "border border-rule bg-paper text-mute hover:text-ink",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          data-testid="assignee-filter-all"
          data-active={assigneeFilter === "all"}
          onClick={() => onAssigneeFilter("all")}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] transition-colors",
            assigneeFilter === "all"
              ? "border border-accent bg-accent-quiet text-accent-ink"
              : "border border-rule bg-paper text-mute hover:text-ink",
          )}
        >
          Everyone
        </button>
        <button
          type="button"
          data-testid="assignee-filter-unassigned"
          data-active={assigneeFilter === "unassigned"}
          onClick={() => onAssigneeFilter("unassigned")}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] transition-colors",
            assigneeFilter === "unassigned"
              ? "border border-accent bg-accent-quiet text-accent-ink"
              : "border border-rule bg-paper text-mute hover:text-ink",
          )}
        >
          Unassigned
        </button>
        <div className="ml-1 flex items-center gap-1">
          {admins.map((a) => {
            const active = assigneeFilter === a.id;
            return (
              <button
                key={a.id}
                type="button"
                data-testid={`assignee-filter-${a.id}`}
                data-active={active}
                onClick={() => onAssigneeFilter(a.id)}
                className={cn(
                  "rounded-full p-0.5 transition-all",
                  active ? "ring-2 ring-accent ring-offset-1 ring-offset-paper" : "opacity-70 hover:opacity-100",
                )}
                title={`Filter to ${a.name}`}
              >
                <AdminAvatar admin={a} size="xs" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
