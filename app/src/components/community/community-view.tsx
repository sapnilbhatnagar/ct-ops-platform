"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TopBar } from "@/components/console-shell/topbar";
import { CommunityPanel } from "./community-panel";
import { ReferralLeaderboard } from "./referral-leaderboard";
import { MOCK_MEMBERS, MOCK_REFERRERS } from "@/lib/mock/community";

type Tab = "travellers" | "referrals";

const TABS: { id: Tab; label: string }[] = [
  { id: "travellers", label: "Booked travellers" },
  { id: "referrals", label: "Referral leaderboard" },
];

export function CommunityView() {
  const [tab, setTab] = useState<Tab>("travellers");

  return (
    <>
      <TopBar section="Community" />
      <main className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display text-[26px] leading-tight text-ink">Community</h1>
          <p className="mt-1 max-w-xl text-[13px] text-mute">
            Booked travellers move into the WhatsApp community, and the friends they bring keep the
            next trips full.
          </p>
        </div>

        <div role="tablist" className="mb-6 inline-flex gap-1 rounded-full border border-rule bg-panel p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              data-testid={`community-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                tab === t.id ? "bg-ink text-paper" : "text-mute hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="max-w-3xl">
          {tab === "travellers" ? (
            <CommunityPanel members={MOCK_MEMBERS} />
          ) : (
            <ReferralLeaderboard referrers={MOCK_REFERRERS} />
          )}
        </div>
      </main>
    </>
  );
}
