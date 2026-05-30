import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeadTable } from "./lead-table";
import { MOCK_ADMINS } from "@/lib/mock/admins";
import type { Lead } from "@/lib/types";

function lead(id: string, name: string, dest: string): Lead {
  return {
    id,
    contactName: name,
    phoneMasked: "+91 90••• ••000",
    language: "en",
    source: "meta_ad",
    status: "in_progress",
    classification: "warm",
    classificationSource: "model",
    assignedToId: null,
    extractedFields: [
      { key: "name", label: "Name", value: name, confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "destination", label: "Destination", value: dest, confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "travel_dates", label: "Travel dates", value: "December", confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "group_size", label: "Group size", value: "2", confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "budget", label: "Budget", value: "20000", confidence: 0.9, extractedAtMessageIndex: 1 },
    ],
    messages: [],
    startedAt: "2026-05-01T00:00:00Z",
    lastActivityAt: "2026-05-01T00:00:00Z",
  };
}

const leads = [lead("a", "Anjali", "Goa"), lead("b", "Bharat", "Kerala")];

describe("LeadTable", () => {
  it("renders a row per lead with the destination", () => {
    render(
      <LeadTable leads={leads} admins={MOCK_ADMINS} sort={{ key: "lastActivity", dir: "desc" }} onSort={() => {}} onSelect={() => {}} />,
    );
    expect(screen.getByTestId("lead-row-a")).toBeInTheDocument();
    expect(screen.getByTestId("lead-row-b")).toBeInTheDocument();
    expect(screen.getByText("Goa")).toBeInTheDocument();
    expect(screen.getByText("Kerala")).toBeInTheDocument();
  });

  it("calls onSelect with the lead id when a row is clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <LeadTable leads={leads} admins={MOCK_ADMINS} sort={{ key: "lastActivity", dir: "desc" }} onSort={() => {}} onSelect={onSelect} />,
    );
    await user.click(screen.getByTestId("lead-row-a"));
    expect(onSelect).toHaveBeenCalledWith("a");
  });

  it("calls onSort with the column key when a sortable header is clicked", async () => {
    const onSort = vi.fn();
    const user = userEvent.setup();
    render(
      <LeadTable leads={leads} admins={MOCK_ADMINS} sort={{ key: "lastActivity", dir: "desc" }} onSort={onSort} onSelect={() => {}} />,
    );
    await user.click(screen.getByTestId("sort-name"));
    expect(onSort).toHaveBeenCalledWith("name");
  });

  it("renders an empty state when there are no leads", () => {
    render(
      <LeadTable leads={[]} admins={MOCK_ADMINS} sort={{ key: "lastActivity", dir: "desc" }} onSort={() => {}} onSelect={() => {}} />,
    );
    expect(screen.getByTestId("lead-table-empty")).toBeInTheDocument();
  });
});
