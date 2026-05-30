import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommunityView } from "./community-view";
import { ReferralLeaderboard } from "./referral-leaderboard";
import { CommunityPanel } from "./community-panel";

describe("CommunityView", () => {
  it("shows booked travellers by default and switches to the leaderboard", async () => {
    const user = userEvent.setup();
    render(<CommunityView />);

    expect(screen.getByTestId("community-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("referral-leaderboard")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("community-tab-referrals"));

    expect(screen.getByTestId("referral-leaderboard")).toBeInTheDocument();
    expect(screen.queryByTestId("community-panel")).not.toBeInTheDocument();
  });
});

describe("ReferralLeaderboard", () => {
  it("ranks referrers by referrals then conversions", () => {
    render(
      <ReferralLeaderboard
        referrers={[
          { id: "a", name: "Anjali", referred: 2, converted: 1 },
          { id: "b", name: "Bharat", referred: 5, converted: 3 },
        ]}
      />,
    );
    const rows = screen.getAllByTestId(/referrer-/);
    expect(rows[0]).toHaveAttribute("data-testid", "referrer-b");
  });

  it("shows an empty state with no referrers", () => {
    render(<ReferralLeaderboard referrers={[]} />);
    expect(screen.getByTestId("leaderboard-empty")).toBeInTheDocument();
  });
});

describe("CommunityPanel", () => {
  it("shows an empty state with no members", () => {
    render(<CommunityPanel members={[]} />);
    expect(screen.getByTestId("community-empty")).toBeInTheDocument();
  });
});
