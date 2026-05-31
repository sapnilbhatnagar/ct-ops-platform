"use client";

import { useCallback, useEffect, useState } from "react";
import {
  makeCriterionKey,
  emptyCampaign,
  type Campaign,
  type QualifyingCriterion,
} from "@/lib/types";

const STORAGE_KEY = "ct.campaigns.v1";

export type CampaignsState = { campaigns: Campaign[]; activeId: string };

// ── Pure reducers (unit-tested) ────────────────────────────────────────────

export function seedState(): CampaignsState {
  const campaign: Campaign = { ...emptyCampaign("Default campaign"), id: "campaign_default" };
  return { campaigns: [campaign], activeId: campaign.id };
}

export function addCriterion(campaigns: Campaign[], campaignId: string, label: string): Campaign[] {
  const trimmed = label.trim();
  if (!trimmed) return campaigns;
  return campaigns.map((c) => {
    if (c.id !== campaignId) return c;
    if (c.criteria.some((cr) => cr.label.toLowerCase() === trimmed.toLowerCase())) return c;
    const criterion: QualifyingCriterion = { key: makeCriterionKey(trimmed), label: trimmed, custom: true };
    return { ...c, criteria: [...c.criteria, criterion] };
  });
}

export function removeCriterion(campaigns: Campaign[], campaignId: string, key: string): Campaign[] {
  return campaigns.map((c) =>
    c.id === campaignId
      ? { ...c, criteria: c.criteria.filter((cr) => cr.key !== key || !cr.custom) }
      : c,
  );
}

export function addCampaign(campaigns: Campaign[], name: string): { campaigns: Campaign[]; id: string } {
  const id = `campaign_${Date.now()}`;
  const campaign: Campaign = { ...emptyCampaign(name.trim() || "Untitled campaign"), id };
  return { campaigns: [...campaigns, campaign], id };
}

// ── Client store (localStorage + subscribers) ──────────────────────────────

let _state: CampaignsState | null = null;
const _subs = new Set<(s: CampaignsState) => void>();

/**
 * Deterministic initial state for the first render: the same seed on the server
 * and the client, so hydration matches. localStorage is read post-mount in the
 * effect (via readStorage), never during render.
 */
function initialState(): CampaignsState {
  if (!_state) _state = seedState();
  return _state;
}

/** Client-only: the state persisted from a previous session, or null. */
function readStorage(): CampaignsState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CampaignsState;
      if (parsed.campaigns?.length) return parsed;
    }
  } catch {
    /* ignore parse / access errors */
  }
  return null;
}

function commit(next: CampaignsState) {
  _state = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / private mode */
    }
  }
  for (const s of _subs) s(next);
}

async function fetchServer(): Promise<CampaignsState | null> {
  try {
    const res = await fetch("/api/campaigns");
    if (!res.ok) return null;
    const data = (await res.json()) as CampaignsState;
    return data?.campaigns?.length ? data : null;
  } catch {
    return null;
  }
}

export function useCampaigns() {
  const [state, setState] = useState<CampaignsState>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onChange = (s: CampaignsState) => setState(s);
    _subs.add(onChange);
    // Post-mount: hydrate from localStorage (kept out of render to match SSR).
    const stored = readStorage();
    if (stored) commit(stored);
    // Then hydrate from the server (Airtable); keep local state if unreachable.
    fetchServer()
      .then((s) => {
        if (s) commit(s);
      })
      .finally(() => setLoading(false));
    return () => {
      _subs.delete(onChange);
    };
  }, []);

  // Back-compat for the intake + leads views until C2 routes criteria per lead.
  const activeCampaign = state.campaigns.find((c) => c.id === state.activeId) ?? state.campaigns[0];

  const getCampaign = useCallback((id: string) => _state!.campaigns.find((c) => c.id === id), []);

  const create = useCallback(async (name: string): Promise<string> => {
    const { campaigns, id } = addCampaign(_state!.campaigns, name);
    commit({ ..._state!, campaigns });
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const created = (await res.json()) as { id?: string };
        const server = await fetchServer();
        if (server) commit(server);
        return created.id ?? id;
      }
    } catch {
      /* offline: keep the optimistic campaign */
    }
    return id;
  }, []);

  const updateCampaign = useCallback((id: string, partial: Partial<Campaign>) => {
    commit({
      ..._state!,
      campaigns: _state!.campaigns.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    });
    fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    }).catch(() => {});
  }, []);

  const patchCriteria = (id: string, campaigns: Campaign[]) => {
    commit({ ..._state!, campaigns });
    const criteria = campaigns.find((c) => c.id === id)?.criteria ?? [];
    fetch("/api/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, criteria }),
    }).catch(() => {});
  };

  const addParam = useCallback((id: string, label: string) => {
    patchCriteria(id, addCriterion(_state!.campaigns, id, label));
  }, []);

  const removeParam = useCallback((id: string, key: string) => {
    patchCriteria(id, removeCriterion(_state!.campaigns, id, key));
  }, []);

  return {
    campaigns: state.campaigns,
    loading,
    activeCampaign,
    getCampaign,
    create,
    updateCampaign,
    addParam,
    removeParam,
  };
}
