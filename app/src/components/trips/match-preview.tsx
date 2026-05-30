"use client";

import { ArrowLeft, Megaphone, AlertTriangle } from "lucide-react";
import { ClassificationBadge } from "@/components/intake/classification-badge";
import {
  classificationBreakdown,
  generateMessage,
  type MatchedLead,
  type Trip,
} from "@/lib/trip-matching";
import type { Classification } from "@/lib/types";

const ORDER: Classification[] = ["hot", "warm", "cold", "unclassified"];

export function MatchPreview({
  trip,
  matched,
  onBack,
  onSend,
}: {
  trip: Trip;
  matched: MatchedLead[];
  onBack: () => void;
  onSend: () => void;
}) {
  const breakdown = classificationBreakdown(matched);

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
            {matched.length} matched {matched.length === 1 ? "lead" : "leads"}
          </div>
          <div className="mt-1 text-[12.5px] text-mute">
            for {trip.destination} · ₹{trip.pricePerPerson.toLocaleString("en-IN")}/person ·{" "}
            {trip.seats} seats
          </div>
        </div>
        <div className="flex gap-1.5" data-testid="match-breakdown">
          {ORDER.filter((c) => breakdown[c] > 0).map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-rule px-2 py-1">
              <ClassificationBadge value={c} size="sm" />
              <span className="text-[12px] tabular-nums text-ink">{breakdown[c]}</span>
            </span>
          ))}
        </div>
      </div>

      {matched.length === 0 ? (
        <div
          data-testid="match-empty"
          className="rounded-lg border border-dashed border-rule px-6 py-12 text-center text-[13px] text-mute"
        >
          No stored leads match this trip yet. Try a broader destination or price.
        </div>
      ) : (
        <ul className="space-y-3">
          {matched.map(({ lead, reason }) => (
            <li
              key={lead.id}
              data-testid={`match-card-${lead.id}`}
              className="rounded-lg border border-rule bg-paper p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[14px] font-medium text-ink">
                  {lead.contactName ?? "Unnamed lead"}
                </div>
                <ClassificationBadge value={lead.classification} size="sm" />
              </div>
              <div className="mt-1 text-[11.5px] text-mute">{reason}</div>
              <div className="mt-3 rounded-md bg-rule/25 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink">
                {generateMessage(lead, trip)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {matched.length > 0 ? (
        <div className="sticky bottom-0 -mx-8 flex items-center justify-between gap-4 border-t border-rule bg-paper px-8 py-4">
          <div className="flex items-center gap-2 text-[11.5px] text-mute">
            <AlertTriangle className="size-3.5 text-warm" />
            Sent in batches to respect WhatsApp rate limits.
          </div>
          <button
            type="button"
            data-testid="broadcast-send"
            onClick={onSend}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-paper transition-opacity hover:opacity-90"
          >
            <Megaphone className="size-3.5" />
            Send to {matched.length} {matched.length === 1 ? "lead" : "leads"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
