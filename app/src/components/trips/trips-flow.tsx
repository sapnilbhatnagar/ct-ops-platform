"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { TopBar } from "@/components/console-shell/topbar";
import { useLeads } from "@/lib/hooks/use-leads";
import { TripForm } from "./trip-form";
import { MatchPreview } from "./match-preview";
import { matchLeadsToTrip, type Trip, type MatchedLead } from "@/lib/trip-matching";

type Phase = "form" | "preview" | "sending" | "summary";

export function TripsFlow({ sendDelayMs = 900 }: { sendDelayMs?: number }) {
  const { leads } = useLeads();
  const [phase, setPhase] = useState<Phase>("form");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [matched, setMatched] = useState<MatchedLead[]>([]);

  useEffect(() => {
    if (phase !== "sending") return;
    const t = setTimeout(() => setPhase("summary"), sendDelayMs);
    return () => clearTimeout(t);
  }, [phase, sendDelayMs]);

  function reset() {
    setPhase("form");
    setTrip(null);
    setMatched([]);
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
            <TripForm
              onSubmit={(t) => {
                setTrip(t);
                setMatched(matchLeadsToTrip(leads, t));
                setPhase("preview");
              }}
            />
          </div>
        ) : null}

        {phase === "preview" && trip ? (
          <MatchPreview
            trip={trip}
            matched={matched}
            onBack={() => setPhase("form")}
            onSend={() => setPhase("sending")}
          />
        ) : null}

        {phase === "sending" ? (
          <div
            data-testid="broadcast-sending"
            className="flex flex-col items-center justify-center gap-3 py-24 text-center"
          >
            <Loader2 className="size-7 animate-spin text-accent" />
            <div className="text-[14px] text-ink">Sending to {matched.length} leads…</div>
            <div className="text-[12px] text-mute">Respecting WhatsApp rate limits</div>
          </div>
        ) : null}

        {phase === "summary" ? (
          <div
            data-testid="broadcast-summary"
            className="mx-auto max-w-md py-20 text-center"
          >
            <CheckCircle2 className="mx-auto size-10 text-ok" />
            <div className="mt-4 font-display text-[24px] leading-tight text-ink">
              Broadcast sent
            </div>
            <p className="mt-2 text-[13px] text-mute">
              <span className="tabular-nums text-ink">{matched.length}</span> messages delivered ·{" "}
              <span className="tabular-nums">0</span> failed
            </p>
            <p className="mt-1 text-[12px] text-mute">
              Replies flow back into the Intake console automatically.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex items-center rounded-full border border-ink px-4 py-2 text-[12.5px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              Plan another trip
            </button>
          </div>
        ) : null}
      </main>
    </>
  );
}
