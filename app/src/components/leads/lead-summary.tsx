"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@/lib/types";

type Summary = { summary: string; nextAction: string };

/**
 * AI summary + suggested next action for a lead's conversation.
 * Fetched on mount (re-mounts per lead via a key on the parent).
 * Hidden entirely when the lead has no transcript.
 */
export function LeadSummary({ leadId, messages }: { leadId: string; messages: Message[] }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (messages.length === 0) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setFailed(false);
    fetch("/api/leads/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, messages }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Summary) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [leadId, messages]);

  if (messages.length === 0 || failed) return null;

  return (
    <div data-testid="lead-summary" className="tile-blue-soft mx-6 mt-5 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-mute">
        <Sparkles className="size-3 text-accent" />
        AI summary
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      ) : summary ? (
        <>
          <p className="text-[13.5px] leading-relaxed text-ink">{summary.summary}</p>
          <div className="mt-3 flex items-start gap-1.5 border-t border-rule pt-3 text-[12.5px] text-ink-soft">
            <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-accent" />
            <span>
              <span className="font-medium">Next:</span> {summary.nextAction}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
