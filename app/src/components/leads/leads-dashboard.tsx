"use client";

import { useMemo, useState } from "react";
import { TopBar } from "@/components/console-shell/topbar";
import { useLeads } from "@/lib/hooks/use-leads";
import { useAdmins } from "@/lib/hooks/use-admins";
import { LeadTable } from "./lead-table";
import { LeadsFilterBar } from "./leads-filter-bar";
import { LeadDetailDrawer } from "./lead-detail-drawer";
import { LeadStats } from "./lead-stats";
import { SkeletonRows } from "@/components/ui/skeleton";
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
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between px-8 pt-6 pb-3">
          <h1 className="font-display text-[26px] leading-tight text-ink">Leads</h1>
          <div className="text-[12px] tabular-nums text-mute" data-testid="leads-count">
            {loading ? "—" : `${visible.length} of ${leads.length}`}
          </div>
        </div>

        <div className="px-8 pb-4">
          <LeadStats leads={leads} loading={loading} />
        </div>

        <div className="min-h-0 flex-1 px-8 pb-8">
          <div className="tile flex h-full min-h-0 flex-col overflow-hidden">
            <LeadsFilterBar
              filter={filter}
              onChange={setFilter}
              destinations={destinations}
              admins={admins}
            />

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div data-testid="leads-loading" className="pt-4">
                  <SkeletonRows rows={8} />
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
