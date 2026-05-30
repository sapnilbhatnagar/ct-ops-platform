"use client";

import { ArrowLeft, Megaphone, AlertTriangle, Sparkles } from "lucide-react";
import { ClassificationBadge } from "@/components/intake/classification-badge";
import type { ReengagementMatch, Trip } from "@/lib/trip-matching";
import type { Classification } from "@/lib/types";

const ORDER: Classification[] = ["hot", "warm", "cold", "unclassified"];

function breakdown(matches: ReengagementMatch[]): Record<Classification, number> {
  const counts: Record<Classification, number> = { hot: 0, warm: 0, cold: 0, unclassified: 0 };
  for (const m of matches) counts[m.classification] += 1;
  return counts;
}

export function MatchPreview({
  trip,
  matches,
  onBack,
  onSend,
}: {
  trip: Trip;
  matches: ReengagementMatch[];
  onBack: () => void;
  onSend: () => void;
}) {
  const counts = breakdown(matches);
  const aiCount = matches.filter((m) => m.messageSource === "model").length;

  return (
    <div className="space-y-6" data-testid="match-preview">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] text-mute transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Edit trip
      </button>

      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-display text-[26px] leading-tight text-ink">
            {matches.length} matched {matches.length === 1 ? "lead" : "leads"}
          </div>
          <div className="mt-1 text-[12.5px] text-mute">
            for {trip.destination} · ₹{trip.pricePerPerson.toLocaleString("en-IN")}/person ·{" "}
            {trip.seats} seats
          </div>
        </div>
        <div className="flex gap-1.5" data-testid="match-breakdown">
          {ORDER.filter((c) => counts[c] > 0).map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-rule px-2 py-1">
              <ClassificationBadge value={c} size="sm" />
              <span className="text-[12px] tabular-nums text-ink">{counts[c]}</span>
            </span>
          ))}
        </div>
      </div>

      {matches.length === 0 ? (
        <div
          data-testid="match-empty"
          className="rounded-lg border border-dashed border-rule px-6 py-12 text-center text-[13px] text-mute"
        >
          No stored leads match this trip yet. Try a broader destination or price.
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.map((m) => (
            <li
              key={m.id}
              data-testid={`match-card-${m.id}`}
              className="rounded-lg border border-rule bg-paper p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[14px] font-medium text-ink">
                  {m.contactName ?? "Unnamed lead"}
                </div>
                <ClassificationBadge value={m.classification} size="sm" />
              </div>
              <div className="mt-1 text-[11.5px] text-mute">{m.reason}</div>
              <div className="mt-3 rounded-md bg-rule/25 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink">
                {m.message}
              </div>
            </li>
          ))}
        </ul>
      )}

      {matches.length > 0 ? (
        <div className="sticky bottom-0 -mx-8 flex items-center justify-between gap-4 border-t border-rule bg-paper px-8 py-4">
          <div className="flex items-center gap-2 text-[11.5px] text-mute">
            {aiCount > 0 ? (
              <>
                <Sparkles className="size-3.5 text-accent" />
                {aiCount} of {matches.length} drafted by Claude
              </>
            ) : (
              <>
                <AlertTriangle className="size-3.5 text-warm" />
                Sent in batches to respect WhatsApp rate limits.
              </>
            )}
          </div>
          <button
            type="button"
            data-testid="broadcast-send"
            onClick={onSend}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-paper transition-opacity hover:opacity-90"
          >
            <Megaphone className="size-3.5" />
            Send to {matches.length} {matches.length === 1 ? "lead" : "leads"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
