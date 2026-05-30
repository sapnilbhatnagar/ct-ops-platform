"use client";

import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/types";

export function LeadStats({ leads, loading }: { leads: Lead[]; loading: boolean }) {
  const total = leads.length;
  const hot = leads.filter((l) => l.classification === "hot").length;
  const warm = leads.filter((l) => l.classification === "warm").length;
  const unassigned = leads.filter((l) => l.assignedToId === null).length;

  const secondary = [
    { label: "Hot", value: hot, dot: "bg-hot" },
    { label: "Warm", value: warm, dot: "bg-warm" },
    { label: "Unassigned", value: unassigned, dot: "bg-cold" },
  ];

  return (
    <div data-testid="lead-stats" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="tile-blue flex flex-col justify-between p-4">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/75">
          Total leads
        </span>
        <span className="mt-3 font-display text-[28px] leading-none tabular-nums">
          {loading ? "—" : total}
        </span>
      </div>
      {secondary.map((s) => (
        <div key={s.label} className="tile flex flex-col justify-between p-4">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-mute">
            <span className={cn("size-1.5 rounded-full", s.dot)} />
            {s.label}
          </span>
          <span className="mt-3 font-display text-[28px] leading-none tabular-nums text-ink">
            {loading ? "—" : s.value}
          </span>
        </div>
      ))}
    </div>
  );
}
