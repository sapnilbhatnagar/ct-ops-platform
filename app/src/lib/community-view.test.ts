import { describe, it, expect } from "vitest";
import {
  groupByTrip,
  sortLeaderboard,
  conversionRate,
  type CommunityMember,
  type Referrer,
} from "./community-view";

function member(id: string, trip: string): CommunityMember {
  return { id, name: id, tripName: trip, invite: "joined", welcome: "sent" };
}

describe("groupByTrip", () => {
  it("groups members by trip, sorted by trip name", () => {
    const members = [member("a", "Kerala"), member("b", "Goa"), member("c", "Kerala")];
    const groups = groupByTrip(members);
    expect(groups.map((g) => g.trip)).toEqual(["Goa", "Kerala"]);
    expect(groups[1].members.map((m) => m.id)).toEqual(["a", "c"]);
  });

  it("returns an empty array for no members", () => {
    expect(groupByTrip([])).toEqual([]);
  });
});

describe("sortLeaderboard", () => {
  const referrers: Referrer[] = [
    { id: "a", name: "Anjali", referred: 2, converted: 1 },
    { id: "b", name: "Bharat", referred: 5, converted: 3 },
    { id: "c", name: "Chetan", referred: 5, converted: 4 },
  ];

  it("sorts by referred count descending, breaking ties on conversions", () => {
    expect(sortLeaderboard(referrers).map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("does not mutate the input", () => {
    const copy = [...referrers];
    sortLeaderboard(referrers);
    expect(referrers).toEqual(copy);
  });
});

describe("conversionRate", () => {
  it("returns the converted/referred fraction", () => {
    expect(conversionRate({ id: "x", name: "X", referred: 4, converted: 1 })).toBe(0.25);
  });

  it("returns 0 when there are no referrals", () => {
    expect(conversionRate({ id: "x", name: "X", referred: 0, converted: 0 })).toBe(0);
  });
});
