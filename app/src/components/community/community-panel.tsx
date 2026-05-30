"use client";

import { cn } from "@/lib/utils";
import { AdminAvatar } from "@/components/intake/admin-avatar";
import { groupByTrip, type CommunityMember, type InviteStatus, type WelcomeStatus } from "@/lib/community-view";

const INVITE_LABEL: Record<InviteStatus, string> = {
  joined: "Joined",
  invited: "Invited",
  not_invited: "Not invited",
};

const INVITE_TONE: Record<InviteStatus, string> = {
  joined: "bg-ok/15 text-ok",
  invited: "bg-cool/25 text-ink",
  not_invited: "bg-rule text-mute",
};

function StatusPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium tracking-wide", tone)}>
      {label}
    </span>
  );
}

function MemberRow({ member }: { member: CommunityMember }) {
  const welcomeLabel: Record<WelcomeStatus, string> = { sent: "Welcomed", pending: "Welcome pending" };
  return (
    <div
      data-testid={`member-${member.id}`}
      className="flex items-center gap-3 px-4 py-3"
    >
      <AdminAvatar admin={{ id: member.id, name: member.name, email: "", initials: "", color: "#9DB4C0", active: true }} size="xs" />
      <span className="flex-1 truncate text-[13.5px] text-ink">{member.name}</span>
      <StatusPill label={INVITE_LABEL[member.invite]} tone={INVITE_TONE[member.invite]} />
      <span className={cn("text-[11px]", member.welcome === "sent" ? "text-ok" : "text-mute")}>
        {welcomeLabel[member.welcome]}
      </span>
    </div>
  );
}

export function CommunityPanel({ members }: { members: CommunityMember[] }) {
  const groups = groupByTrip(members);

  if (groups.length === 0) {
    return (
      <div
        data-testid="community-empty"
        className="rounded-lg border border-dashed border-rule px-6 py-16 text-center text-[13px] text-mute"
      >
        No booked travellers yet. Once a trip fills, its travellers land here for the welcome flow.
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="community-panel">
      {groups.map((g) => {
        const joined = g.members.filter((m) => m.invite === "joined").length;
        return (
          <section key={g.trip} data-testid={`trip-group-${g.trip}`}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-[13px] font-medium text-ink">{g.trip}</h2>
              <span className="text-[11px] tabular-nums text-mute">
                {joined}/{g.members.length} joined
              </span>
            </div>
            <div className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-paper">
              {g.members.map((m) => (
                <MemberRow key={m.id} member={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
