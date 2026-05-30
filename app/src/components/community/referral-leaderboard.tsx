"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { sortLeaderboard, conversionRate, type Referrer } from "@/lib/community-view";

function RankRow({ referrer, rank }: { referrer: Referrer; rank: number }) {
  const rate = conversionRate(referrer);
  const leader = rank === 1;
  return (
    <li
      data-testid={`referrer-${referrer.id}`}
      className="flex items-center gap-4 px-4 py-3.5"
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-medium tabular-nums",
          leader ? "bg-accent text-paper" : "bg-rule text-mute",
        )}
      >
        {rank}
      </span>
      <span className="flex-1 truncate text-[13.5px] text-ink">{referrer.name}</span>

      <div className="hidden w-40 sm:block">
        <div className="h-1.5 overflow-hidden rounded-full bg-rule">
          <div
            className={cn("h-full rounded-full", leader ? "bg-accent" : "bg-cool")}
            style={{ width: `${Math.round(rate * 100)}%` }}
          />
        </div>
      </div>

      <span className="w-24 text-right text-[12px] tabular-nums text-mute">
        {referrer.converted}/{referrer.referred} converted
      </span>
      <span className="w-12 text-right text-[13px] font-medium tabular-nums text-ink">
        {Math.round(rate * 100)}%
      </span>
    </li>
  );
}

export function ReferralLeaderboard({ referrers }: { referrers: Referrer[] }) {
  const ranked = sortLeaderboard(referrers);

  if (ranked.length === 0) {
    return (
      <div
        data-testid="leaderboard-empty"
        className="rounded-lg border border-dashed border-rule px-6 py-16 text-center text-[13px] text-mute"
      >
        No referrals yet. When a traveller invites a friend who books, they climb this board.
      </div>
    );
  }

  return (
    <div data-testid="referral-leaderboard">
      <div className="mb-3 flex items-center gap-2 text-[12px] text-mute">
        <Trophy className="size-3.5 text-accent" />
        Ranked by friends referred, then by how many booked.
      </div>
      <ol className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-paper">
        {ranked.map((r, i) => (
          <RankRow key={r.id} referrer={r} rank={i + 1} />
        ))}
      </ol>
    </div>
  );
}
