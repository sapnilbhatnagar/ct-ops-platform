import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const updateLead = vi.fn();
vi.mock("@/lib/hooks/use-leads", () => ({
  useLeads: () => ({
    leads: [
      { id: "L1", contactName: "Arjun", classification: "warm", campaignId: "c1", bookingStatus: "enquiry" },
      { id: "L2", contactName: "Other", classification: "cold", campaignId: "c2", bookingStatus: "enquiry" },
    ],
    loading: false,
    updateLead,
  }),
}));

import { EnquiriesSection } from "./enquiries-section";
import { emptyCampaign, type Campaign } from "@/lib/types";

const campaign = (over: Partial<Campaign> = {}): Campaign => ({
  ...emptyCampaign("Trip"),
  id: "c1",
  seatsTotal: 12,
  seatsBooked: 4,
  ...over,
});

describe("EnquiriesSection", () => {
  it("shows only this campaign's leads and the seat summary", () => {
    render(<EnquiriesSection campaign={campaign()} onCampaignChange={() => {}} />);
    expect(screen.getByTestId("enquiry-L1")).toBeInTheDocument();
    expect(screen.queryByTestId("enquiry-L2")).not.toBeInTheDocument();
    expect(screen.getByTestId("seats-summary")).toHaveTextContent("4 / 12 booked");
  });

  it("booking a lead updates the lead and increments the campaign's seats", async () => {
    const onCampaignChange = vi.fn();
    const user = userEvent.setup();
    render(<EnquiriesSection campaign={campaign()} onCampaignChange={onCampaignChange} />);
    await user.click(screen.getByTestId("booking-booked"));
    expect(updateLead).toHaveBeenCalledWith("L1", { bookingStatus: "booked" });
    expect(onCampaignChange).toHaveBeenCalledWith({ seatsBooked: 5 });
  });
});
