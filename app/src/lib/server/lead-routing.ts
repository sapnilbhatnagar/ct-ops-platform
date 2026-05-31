import { DEFAULT_CRITERIA } from "@/lib/types";
import type { Campaign, QualifyingCriterion } from "@/lib/types";

/** A live campaign reduced to what routing + the agent need. key === campaign id. */
export type RoutableCampaign = { key: string; name: string; destination: string };

export type RoutingDecision = {
  campaignId: string | null;
  awaitingChoice: boolean; // true => the agent asked the lead to pick; stay unrouted
  source: "existing" | "single" | "agent" | "none";
};

/** Validate a campaign key against the live set (guards hallucinated keys). */
export function isLiveKey(
  key: string | null | undefined,
  live: RoutableCampaign[],
): key is string {
  return !!key && live.some((c) => c.key === key);
}

/** True only when we must consult the agent to route (multi-live, not yet routed). */
export function needsAgentRouting(
  currentCampaignId: string | null,
  live: RoutableCampaign[],
): boolean {
  return !currentCampaignId && live.length >= 2;
}

/**
 * Pure routing decision. `agentChoiceKey` is the campaign key the agent put in
 * its `campaign` output this turn (null/undefined if it asked or has not run).
 */
export function resolveCampaign(
  currentCampaignId: string | null,
  live: RoutableCampaign[],
  agentChoiceKey?: string | null,
): RoutingDecision {
  if (currentCampaignId)
    return { campaignId: currentCampaignId, awaitingChoice: false, source: "existing" };
  if (live.length === 0) return { campaignId: null, awaitingChoice: false, source: "none" };
  if (live.length === 1) return { campaignId: live[0].key, awaitingChoice: false, source: "single" };
  if (isLiveKey(agentChoiceKey, live))
    return { campaignId: agentChoiceKey, awaitingChoice: false, source: "agent" };
  return { campaignId: null, awaitingChoice: true, source: "agent" };
}

/** Routed -> that campaign's criteria; unrouted/unknown -> the five defaults. */
export function criteriaForLead(
  campaignId: string | null,
  campaignsById: Map<string, Pick<Campaign, "id" | "criteria">>,
): QualifyingCriterion[] {
  const c = campaignId ? campaignsById.get(campaignId) : undefined;
  return c?.criteria ?? [...DEFAULT_CRITERIA];
}
