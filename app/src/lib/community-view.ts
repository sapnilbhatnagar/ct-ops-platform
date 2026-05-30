export type InviteStatus = "not_invited" | "invited" | "joined";
export type WelcomeStatus = "pending" | "sent";

export type CommunityMember = {
  id: string;
  name: string;
  tripName: string;
  invite: InviteStatus;
  welcome: WelcomeStatus;
};

export type Referrer = {
  id: string;
  name: string;
  referred: number;
  converted: number;
};

export type TripGroup = {
  trip: string;
  members: CommunityMember[];
};

export function groupByTrip(members: CommunityMember[]): TripGroup[] {
  const map = new Map<string, CommunityMember[]>();
  for (const m of members) {
    const list = map.get(m.tripName) ?? [];
    list.push(m);
    map.set(m.tripName, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([trip, members]) => ({ trip, members }));
}

export function sortLeaderboard(referrers: Referrer[]): Referrer[] {
  return [...referrers].sort((a, b) => b.referred - a.referred || b.converted - a.converted);
}

export function conversionRate(r: Referrer): number {
  return r.referred === 0 ? 0 : r.converted / r.referred;
}
