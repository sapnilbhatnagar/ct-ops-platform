"use client";

import { useMemo, useState } from "react";
import { useLeads } from "@/lib/hooks/use-leads";
import { useAdmins } from "@/lib/hooks/use-admins";
import { LeadTable } from "@/components/leads/lead-table";
import { sortLeads, type SortKey, type SortDir } from "@/lib/leads-view";

export function EnquiriesSection({ campaignId }: { campaignId: string }) {
  const { leads, loading } = useLeads();
  const { admins } = useAdmins();
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "lastActivity",
    dir: "desc",
  });

  const mine = useMemo(
    () => sortLeads(leads.filter((l) => l.campaignId === campaignId), sort.key, sort.dir),
    [leads, campaignId, sort],
  );

  function handleSort(key: SortKey) {
    setSort((p) =>
      p.key === key
        ? { key, dir: p.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" || key === "destination" ? "asc" : "desc" },
    );
  }

  if (loading) {
    return <div className="tile px-5 py-6 text-[13px] text-mute">Loading enquiries…</div>;
  }
  if (mine.length === 0) {
    return (
      <div className="tile px-5 py-6 text-[13px] text-mute">
        No leads routed to this campaign yet. New WhatsApp enquiries that match land here.
      </div>
    );
  }

  return (
    <div className="tile overflow-hidden">
      <LeadTable
        leads={mine}
        admins={admins}
        sort={sort}
        onSort={handleSort}
        onSelect={() => {}}
        showCampaign={false}
      />
    </div>
  );
}
