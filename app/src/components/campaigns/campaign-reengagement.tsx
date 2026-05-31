"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import { MatchPreview } from "@/components/trips/match-preview";
import { campaignToTrip, type ReengagementMatch } from "@/lib/trip-matching";
import type { Campaign } from "@/lib/types";

type Phase = "idle" | "matching" | "preview" | "sending" | "done" | "error";

export function CampaignReengagement({ campaign }: { campaign: Campaign }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [matches, setMatches] = useState<ReengagementMatch[]>([]);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  async function findMatches() {
    setPhase("matching");
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/match`, { method: "POST" });
      setMatches((await res.json()) as ReengagementMatch[]);
      setPhase("preview");
    } catch {
      setPhase("error");
    }
  }

  async function send() {
    setPhase("sending");
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matches }),
      });
      setResult((await res.json()) as { sent: number; failed: number });
      setPhase("done");
    } catch {
      setPhase("error");
    }
  }

  if (phase === "preview") {
    return (
      <MatchPreview
        trip={campaignToTrip(campaign)}
        matches={matches}
        onBack={() => setPhase("idle")}
        onSend={send}
      />
    );
  }
  if (phase === "sending") {
    return <div className="tile px-5 py-6 text-[13px] text-mute">Sending…</div>;
  }
  if (phase === "done") {
    return (
      <div className="tile px-5 py-6 text-[13px] text-ink">
        Sent {result?.sent ?? 0} message{result?.sent === 1 ? "" : "s"}
        {result?.failed ? `, ${result.failed} failed` : ""} (sim mode).{" "}
        <button type="button" className="text-accent" onClick={() => setPhase("idle")}>
          Done
        </button>
      </div>
    );
  }
  if (phase === "error") {
    return (
      <div className="tile px-5 py-6 text-[13px] text-hot">
        Something went wrong.{" "}
        <button type="button" className="text-accent" onClick={() => setPhase("idle")}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="tile px-5 py-6">
      <p className="text-[13px] text-mute">
        Find past leads whose destination or budget fits this campaign and message them with the
        trip details (Claude drafts each message; sim mode until the WhatsApp key arrives).
      </p>
      <button
        type="button"
        data-testid="find-matches"
        onClick={findMatches}
        disabled={phase === "matching"}
        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Megaphone className="size-3.5" />
        {phase === "matching" ? "Finding…" : "Find matching leads"}
      </button>
    </div>
  );
}
