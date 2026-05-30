"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { TopBar } from "@/components/console-shell/topbar";
import { TripForm } from "./trip-form";
import { MatchPreview } from "./match-preview";
import type { Trip, ReengagementMatch } from "@/lib/trip-matching";

type Phase = "form" | "matching" | "preview" | "sending" | "summary";

export function TripsFlow() {
  const [phase, setPhase] = useState<Phase>("form");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [matches, setMatches] = useState<ReengagementMatch[]>([]);
  const [summary, setSummary] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTripSubmit(t: Trip) {
    setTrip(t);
    setError(null);
    setPhase("matching");
    try {
      const res = await fetch("/api/trips/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      });
      if (!res.ok) throw new Error(`match failed (${res.status})`);
      setMatches((await res.json()) as ReengagementMatch[]);
      setPhase("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not match leads.");
      setPhase("form");
    }
  }

  async function handleSend() {
    setPhase("sending");
    try {
      const res = await fetch("/api/trips/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matches }),
      });
      if (!res.ok) throw new Error(`broadcast failed (${res.status})`);
      setSummary((await res.json()) as { sent: number; failed: number });
      setPhase("summary");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Broadcast failed.");
      setPhase("preview");
    }
  }

  function reset() {
    setPhase("form");
    setTrip(null);
    setMatches([]);
    setSummary(null);
    setError(null);
  }

  return (
    <>
      <TopBar section="Trips" />
      <main className="min-h-0 flex-1 overflow-y-auto px-8 py-10">
        {phase === "form" ? (
          <div className="space-y-7">
            <div>
              <h1 className="font-display text-[26px] leading-tight text-ink">Launch a trip</h1>
              <p className="mt-1 max-w-xl text-[13px] text-mute">
                Describe the trip and we will match it against every stored lead, then draft a
                personalised WhatsApp message for each one.
              </p>
            </div>
            {error ? (
              <div className="flex items-center gap-2 text-[12.5px] text-accent" data-testid="trip-flow-error">
                <AlertCircle className="size-3.5" />
                {error}
              </div>
            ) : null}
            <div className="tile max-w-2xl p-6">
              <TripForm onSubmit={handleTripSubmit} />
            </div>
          </div>
        ) : null}

        {phase === "matching" ? (
          <div
            data-testid="trip-matching"
            className="flex flex-col items-center justify-center gap-3 py-24 text-center"
          >
            <Loader2 className="size-7 animate-spin text-accent" />
            <div className="text-[14px] text-ink">Matching leads and drafting messages…</div>
            <div className="text-[12px] text-mute">Claude is personalising each message</div>
          </div>
        ) : null}

        {phase === "preview" && trip ? (
          <MatchPreview
            trip={trip}
            matches={matches}
            onBack={() => setPhase("form")}
            onSend={handleSend}
          />
        ) : null}

        {phase === "sending" ? (
          <div
            data-testid="broadcast-sending"
            className="flex flex-col items-center justify-center gap-3 py-24 text-center"
          >
            <Loader2 className="size-7 animate-spin text-accent" />
            <div className="text-[14px] text-ink">Sending to {matches.length} leads…</div>
            <div className="text-[12px] text-mute">Respecting WhatsApp rate limits</div>
          </div>
        ) : null}

        {phase === "summary" && summary ? (
          <div data-testid="broadcast-summary" className="tile mx-auto mt-10 max-w-md px-8 py-12 text-center">
            <CheckCircle2 className="mx-auto size-10 text-ok" />
            <div className="mt-4 font-display text-[24px] leading-tight text-ink">Broadcast sent</div>
            <p className="mt-2 text-[13px] text-mute">
              <span className="tabular-nums text-ink">{summary.sent}</span> messages delivered ·{" "}
              <span className="tabular-nums">{summary.failed}</span> failed
            </p>
            <p className="mt-1 text-[12px] text-mute">
              Replies flow back into the Intake console automatically.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex items-center rounded-full border border-accent px-4 py-2 text-[12.5px] font-medium text-accent transition-colors hover:bg-accent hover:text-white"
            >
              Plan another trip
            </button>
          </div>
        ) : null}
      </main>
    </>
  );
}
