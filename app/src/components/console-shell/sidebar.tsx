"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessagesSquare,
  Users,
  Map,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Intake",
    href: "/intake",
    icon: MessagesSquare,
    description: "Live WhatsApp conversations being qualified by the AI agent.",
  },
  {
    label: "Leads",
    href: "/leads",
    icon: Users,
    description: "Every lead across every campaign, filterable and pipelined.",
  },
  {
    label: "Trips",
    href: "/trips",
    icon: Map,
    description: "Compose a new trip and re-engage matched leads.",
  },
  {
    label: "Community",
    href: "/community",
    icon: Sparkles,
    description: "Booked travellers, welcomes, and the referral leaderboard.",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Schema, conversation flow, classification thresholds.",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      data-testid="console-sidebar"
      className="glass-dark sticky top-0 flex h-dvh w-60 shrink-0 flex-col text-ink"
    >
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-8">
        <div className="flex size-8 items-center justify-center rounded-[10px] bg-accent text-[15px] font-semibold text-white shadow-[var(--shadow-blue)]">
          C
        </div>
        <div className="leading-tight">
          <div className="text-[13.5px] font-semibold tracking-tight text-ink">Connecting Traveller</div>
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-mute">Ops Console</div>
        </div>
      </div>

      <nav className="flex-1 px-2.5">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  data-active={active}
                  className={cn(
                    "flex items-center gap-3 rounded-[11px] px-3 py-2 text-[13.5px] transition-colors",
                    active
                      ? "bg-accent font-medium text-white shadow-[var(--shadow-blue)]"
                      : "text-ink-soft hover:bg-canvas hover:text-ink",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-rule px-5 py-4 text-[11px] text-mute">v0.1 · sim mode</div>
    </aside>
  );
}
