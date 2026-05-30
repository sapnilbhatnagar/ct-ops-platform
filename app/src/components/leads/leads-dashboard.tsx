"use client";

import { useMemo, useState } from "react";
import { TopBar } from "@/components/console-shell/topbar";
import { useLeads } from "@/lib/hooks/use-leads";
import { useAdmins } from "@/lib/hooks/use-admins";
import { LeadTable } from "./lead-table";
import { LeadsFilterBar } from "./leads-filter-bar";
import { LeadDetailDrawer } from "./lead-detail-drawer";
import {
  filterLeads,
  sortLeads,
  destinationOptions,
  emptyFilter,
  type SortKey,
  type SortDir,
} from "@/lib/leads-view";

export function LeadsDashboard() {
  const { leads, loading, updateLead } = useLeads();
  const { admins } = useAdmins();
  const [filter, setFilter] = useState(emptyFilter);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "lastActivity",
    dir: "desc",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const destinations = useMemo(() => destinationOptions(leads), [leads]);

  const visible = useMemo(() => {
    return sortLeads(filterLeads(leads, filter), sort.key, sort.dir);
  }, [leads, filter, sort]);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  );

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" || key === "destination" ? "asc" : "desc" },
    );
  }

  return (
    <>
      <TopBar section="Leads" />
      <div className="flex min-h-0 flex-1 flex-col bg-paper">
        <div className="flex items-baseline justify-between px-8 pt-6 pb-3">
          <h1 className="font-display text-[26px] leading-tight text-ink">Leads</h1>
          <div className="text-[12px] tabular-nums text-mute" data-testid="leads-count">
            {loading ? "—" : `${visible.length} of ${leads.length}`}
          </div>
        </div>

        <LeadsFilterBar
          filter={filter}
          onChange={setFilter}
          destinations={destinations}
          admins={admins}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div
              data-testid="leads-loading"
              className="flex flex-1 items-center justify-center px-8 py-20 text-[13px] text-mute"
            >
              Loading leads…
            </div>
          ) : (
            <LeadTable
              leads={visible}
              admins={admins}
              sort={sort}
              onSort={handleSort}
              onSelect={setSelectedId}
            />
          )}
        </div>
      </div>

      <LeadDetailDrawer
        lead={selectedLead}
        admins={admins}
        onUpdate={updateLead}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}
