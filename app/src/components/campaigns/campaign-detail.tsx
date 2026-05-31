"use client";

import Link from "next/link";
import { TopBar } from "@/components/console-shell/topbar";
import { useCampaigns } from "@/lib/hooks/use-campaigns";
import { CriteriaConfigurator } from "@/components/settings/criteria-configurator";
import { CampaignOverviewForm } from "./campaign-overview-form";
import { ItineraryEditor } from "./itinerary-editor";
import { EnquiriesSection } from "./enquiries-section";
import { CampaignReengagement } from "./campaign-reengagement";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-2 font-display text-[15px] text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function CampaignDetail({ id }: { id: string }) {
  const { getCampaign, loading, updateCampaign, addParam, removeParam } = useCampaigns();
  const campaign = getCampaign(id);

  if (!campaign) {
    return (
      <>
        <TopBar section="Campaigns" />
        <main className="flex-1 px-8 py-8">
          {loading ? (
            <div className="text-[13px] text-mute">Loading campaign…</div>
          ) : (
            <div className="tile px-6 py-10 text-center text-[13px] text-mute">
              Campaign not found.{" "}
              <Link href="/campaigns" className="text-accent">
                Back to campaigns
              </Link>
            </div>
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar section={campaign.name} />
      <main className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <Section id="overview" title="Overview">
            <CampaignOverviewForm campaign={campaign} onSave={(p) => updateCampaign(id, p)} />
          </Section>
          <Section id="itinerary" title="Itinerary">
            <ItineraryEditor campaign={campaign} onSave={(p) => updateCampaign(id, p)} />
          </Section>
          <Section id="criteria" title="Qualifying criteria">
            <CriteriaConfigurator
              campaign={campaign}
              onAdd={(label) => addParam(id, label)}
              onRemove={(key) => removeParam(id, key)}
            />
          </Section>
          <Section id="enquiries" title="Enquiries">
            <EnquiriesSection campaign={campaign} onCampaignChange={(p) => updateCampaign(id, p)} />
          </Section>
          <Section id="reengagement" title="Re-engagement">
            <CampaignReengagement campaign={campaign} />
          </Section>
        </div>
      </main>
    </>
  );
}
