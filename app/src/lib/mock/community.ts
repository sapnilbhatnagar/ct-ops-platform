import type { CommunityMember, Referrer } from "@/lib/community-view";

export const MOCK_MEMBERS: CommunityMember[] = [
  { id: "m1", name: "Priya Sharma", tripName: "Rajasthan Royal · Oct", invite: "joined", welcome: "sent" },
  { id: "m2", name: "Arjun Mehta", tripName: "Rajasthan Royal · Oct", invite: "joined", welcome: "sent" },
  { id: "m3", name: "Neha Kapoor", tripName: "Rajasthan Royal · Oct", invite: "invited", welcome: "pending" },
  { id: "m4", name: "Rohan Das", tripName: "Kerala Backwaters · Dec", invite: "joined", welcome: "sent" },
  { id: "m5", name: "Sara Iyer", tripName: "Kerala Backwaters · Dec", invite: "invited", welcome: "pending" },
  { id: "m6", name: "Vikram Rao", tripName: "Kerala Backwaters · Dec", invite: "not_invited", welcome: "pending" },
  { id: "m7", name: "Ananya Bose", tripName: "Ladakh Expedition · Jun", invite: "joined", welcome: "sent" },
  { id: "m8", name: "Karan Singh", tripName: "Ladakh Expedition · Jun", invite: "not_invited", welcome: "pending" },
];

export const MOCK_REFERRERS: Referrer[] = [
  { id: "r1", name: "Priya Sharma", referred: 6, converted: 4 },
  { id: "r2", name: "Rohan Das", referred: 5, converted: 3 },
  { id: "r3", name: "Ananya Bose", referred: 3, converted: 2 },
  { id: "r4", name: "Arjun Mehta", referred: 2, converted: 0 },
];
