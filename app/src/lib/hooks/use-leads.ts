"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lead, Classification, ExtractedField, Message } from "@/lib/types";

type LeadsState = {
  leads: Lead[];
  loading: boolean;
  error: string | null;
};

// Global cache so multiple hook instances share state without redundant fetches
let _cache: Lead[] | null = null;
const _subscribers = new Set<(next: Lead[]) => void>();

function publish(next: Lead[]) {
  _cache = next;
  for (const s of _subscribers) s([...next]);
}

async function fetchLeads(): Promise<Lead[]> {
  const res = await fetch("/api/leads");
  if (!res.ok) throw new Error(`/api/leads returned ${res.status}`);
  return res.json() as Promise<Lead[]>;
}

export function useLeads(): LeadsState & {
  updateLead: (id: string, partial: Partial<Lead>) => void;
  advanceConversation: (id: string) => void;
  reload: () => Promise<void>;
} {
  const [leads, setLeads] = useState<Lead[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const onChange = (next: Lead[]) => {
      if (mounted.current) setLeads(next);
    };
    _subscribers.add(onChange);

    if (_cache === null) {
      fetchLeads()
        .then((data) => {
          publish(data);
          if (mounted.current) setLoading(false);
        })
        .catch((e: unknown) => {
          if (mounted.current) {
            setError(e instanceof Error ? e.message : "Failed to load leads");
            setLoading(false);
          }
        });
    }

    return () => {
      mounted.current = false;
      _subscribers.delete(onChange);
    };
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLeads();
      publish(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reload leads");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLead = useCallback(async (id: string, partial: Partial<Lead>) => {
    // Optimistic update first, then persist
    if (_cache) publish(_cache.map((l) => (l.id === id ? { ...l, ...partial } : l)));
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
    } catch (e) {
      console.error("[useLeads] updateLead failed:", e);
    }
  }, []);

  // Advance mock-data pending messages (no-ops on real Airtable leads)
  const advanceConversation = useCallback((id: string) => {
    if (!_cache) return;
    publish(
      _cache.map((l) => {
        if (l.id !== id || !l.pendingMessages?.length) return l;
        const [next, ...rest] = l.pendingMessages;
        const messages: Message[] = [...l.messages, next];
        let extractedFields: ExtractedField[] = l.extractedFields;
        if (l.pendingExtractions) {
          extractedFields = l.extractedFields.map((f) => {
            const u = l.pendingExtractions?.find((p) => p.key === f.key);
            return u ?? f;
          });
        }
        const classification: Classification = l.pendingClassification ?? l.classification;
        return {
          ...l,
          messages,
          extractedFields,
          classification,
          lastActivityAt: next.timestamp,
          pendingMessages: rest.length > 0 ? rest : undefined,
        };
      }),
    );
  }, []);

  return { leads, loading, error, updateLead, advanceConversation, reload };
}
