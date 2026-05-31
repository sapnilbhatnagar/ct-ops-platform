"use client";

import { useLeads } from "@/lib/hooks/use-leads";
import { ClassificationBadge } from "@/components/intake/classification-badge";
import { applyBooking } from "@/lib/booking";
import type { Campaign, BookingStatus, Lead } from "@/lib/types";

const STATUSES: BookingStatus[] = ["enquiry", "booked", "travelled"];

export function EnquiriesSection({
  campaign,
  onCampaignChange,
}: {
  campaign: Campaign;
  onCampaignChange: (partial: Partial<Campaign>) => void;
}) {
  const { leads, loading, updateLead } = useLeads();
  const mine = leads.filter((l) => l.campaignId === campaign.id);

  function setBooking(lead: Lead, to: BookingStatus) {
    if (lead.bookingStatus === to) return;
    onCampaignChange({
      seatsBooked: applyBooking(campaign.seatsBooked, campaign.seatsTotal, lead.bookingStatus, to),
    });
    updateLead(lead.id, { bookingStatus: to });
  }

  if (loading) {
    return <div className="tile px-5 py-6 text-[13px] text-mute">Loading enquiries…</div>;
  }

  return (
    <div className="tile overflow-hidden">
      <div className="flex items-center justify-between border-b border-rule px-5 py-3">
        <span className="text-[12.5px] text-mute">
          {mine.length} {mine.length === 1 ? "enquiry" : "enquiries"}
        </span>
        <span className="text-[12.5px] tabular-nums text-ink" data-testid="seats-summary">
          {campaign.seatsBooked}
          {campaign.seatsTotal != null ? ` / ${campaign.seatsTotal}` : ""} booked
        </span>
      </div>

      {mine.length === 0 ? (
        <div className="px-5 py-6 text-[13px] text-mute">
          No leads routed to this campaign yet. New WhatsApp enquiries that match land here.
        </div>
      ) : (
        <ul className="divide-y divide-rule">
          {mine.map((l) => (
            <li
              key={l.id}
              data-testid={`enquiry-${l.id}`}
              className="flex items-center gap-3 px-5 py-3"
            >
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
                {l.contactName ?? "Unnamed lead"}
              </span>
              <ClassificationBadge value={l.classification} size="sm" />
              <BookingControl value={l.bookingStatus} onChange={(to) => setBooking(l, to)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BookingControl({
  value,
  onChange,
}: {
  value: BookingStatus;
  onChange: (to: BookingStatus) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-rule p-0.5">
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          data-testid={`booking-${s}`}
          onClick={() => onChange(s)}
          className={
            value === s
              ? "rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium capitalize text-white"
              : "rounded-md px-2.5 py-1 text-[11px] capitalize text-mute transition-colors hover:text-ink"
          }
        >
          {s}
        </button>
      ))}
    </div>
  );
}
