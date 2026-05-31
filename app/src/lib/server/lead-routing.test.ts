import { describe, it, expect } from "vitest";
import { resolveCampaign, needsAgentRouting, isLiveKey, criteriaForLead } from "./lead-routing";
import { DEFAULT_CRITERIA, type QualifyingCriterion } from "@/lib/types";

const live = (...keys: string[]) => keys.map((k) => ({ key: k, name: k, destination: k }));

describe("resolveCampaign", () => {
  it("keeps an already-routed lead regardless of the live set", () => {
    expect(resolveCampaign("camp_X", live("a", "b"), "a")).toEqual({
      campaignId: "camp_X",
      awaitingChoice: false,
      source: "existing",
    });
  });

  it("auto-routes when exactly one campaign is live (before the agent runs)", () => {
    expect(resolveCampaign(null, live("only"), undefined)).toEqual({
      campaignId: "only",
      awaitingChoice: false,
      source: "single",
    });
  });

  it("routes to none when no campaign is live", () => {
    expect(resolveCampaign(null, live(), "anything")).toEqual({
      campaignId: null,
      awaitingChoice: false,
      source: "none",
    });
  });

  it("routes to the agent's key when multi-live and the key is valid", () => {
    expect(resolveCampaign(null, live("a", "b"), "b")).toEqual({
      campaignId: "b",
      awaitingChoice: false,
      source: "agent",
    });
  });

  it("awaits a choice when multi-live and the agent returned null", () => {
    expect(resolveCampaign(null, live("a", "b"), null)).toEqual({
      campaignId: null,
      awaitingChoice: true,
      source: "agent",
    });
  });

  it("rejects a hallucinated key and keeps awaiting", () => {
    expect(resolveCampaign(null, live("a", "b"), "ghost")).toEqual({
      campaignId: null,
      awaitingChoice: true,
      source: "agent",
    });
  });
});

describe("needsAgentRouting + isLiveKey", () => {
  it("needs the agent only when unrouted and 2+ live", () => {
    expect(needsAgentRouting(null, live("a", "b"))).toBe(true);
    expect(needsAgentRouting(null, live("a"))).toBe(false);
    expect(needsAgentRouting("camp_X", live("a", "b"))).toBe(false);
  });

  it("validates keys against the live set", () => {
    expect(isLiveKey("a", live("a", "b"))).toBe(true);
    expect(isLiveKey("ghost", live("a", "b"))).toBe(false);
    expect(isLiveKey(null, live("a"))).toBe(false);
  });
});

describe("criteriaForLead", () => {
  it("returns the routed campaign's criteria", () => {
    const custom: QualifyingCriterion[] = [{ key: "occasion", label: "Occasion", custom: true }];
    const byId = new Map([["c1", { id: "c1", criteria: custom }]]);
    expect(criteriaForLead("c1", byId)).toBe(custom);
  });

  it("falls back to the defaults when unrouted or unknown", () => {
    expect(criteriaForLead(null, new Map())).toEqual(DEFAULT_CRITERIA);
    expect(criteriaForLead("missing", new Map())).toEqual(DEFAULT_CRITERIA);
  });
});
