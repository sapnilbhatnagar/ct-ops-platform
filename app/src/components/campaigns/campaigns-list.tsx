"use client";

import { TopBar } from "@/components/console-shell/topbar";
import { useCampaigns } from "@/lib/hooks/use-campaigns";
import { useLeads } from "@/lib/hooks/use-leads";
import { useAdmins } from "@/lib/hooks/use-admins";
import { campaignTiles } from "@/lib/campaigns-view";
import { CampaignTile } from "./campaign-tile";
import { NewCampaignButton } from "./new-campaign-button";

export function CampaignsList() {
  const { campaigns, loading } = useCampaigns();
  const { leads } = useLeads();
  const { admins } = useAdmins();
  const tiles = campaignTiles(campaigns, leads, admins);

  return (
    <>
      <TopBar section="Campaigns" />
      <main className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-display text-[24px] leading-tight text-ink">Campaigns</h1>
            <p className="mt-1 text-[13px] text-mute">
              Each campaign owns its trip, the leads it sources, and its re-engagement.
            </p>
          </div>
          <NewCampaignButton />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="tile h-[68px] animate-pulse" />
            ))}
          </div>
        ) : tiles.length === 0 ? (
          <div className="tile px-6 py-12 text-center">
            <div className="text-[14px] text-ink">No campaigns yet</div>
            <div className="mt-1 text-[12.5px] text-mute">
              Create your first campaign to start sourcing and qualifying leads.
            </div>
          </div>
        ) : (
          <div className="space-y-3" data-testid="campaign-tiles">
            {tiles.map((vm) => (
              <CampaignTile key={vm.id} vm={vm} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
