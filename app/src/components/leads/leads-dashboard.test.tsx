import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeadsDashboard } from "./leads-dashboard";
import { MOCK_ADMINS } from "@/lib/mock/admins";
import type { Lead } from "@/lib/types";

function lead(id: string, name: string, cls: Lead["classification"], dest: string): Lead {
  return {
    id,
    contactName: name,
    phoneMasked: "+91 90••• ••000",
    language: "en",
    source: "meta_ad",
    status: "in_progress",
    classification: cls,
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

const LEADS = [lead("hot1", "Anjali", "hot", "Goa"), lead("cold1", "Bharat", "cold", "Kerala")];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const body = url.includes("/api/admins") ? MOCK_ADMINS : LEADS;
      return Promise.resolve({ ok: true, json: async () => body });
    }),
  );
});

describe("LeadsDashboard", () => {
  it("loads and lists leads with the count", async () => {
    render(<LeadsDashboard />);
    await waitFor(() => expect(screen.getByTestId("lead-row-hot1")).toBeInTheDocument());
    expect(screen.getByTestId("lead-row-cold1")).toBeInTheDocument();
    expect(screen.getByTestId("leads-count")).toHaveTextContent("2 of 2");
  });

  it("narrows the table when a classification chip is selected", async () => {
    const user = userEvent.setup();
    render(<LeadsDashboard />);
    await waitFor(() => expect(screen.getByTestId("lead-row-hot1")).toBeInTheDocument());

    await user.click(screen.getByTestId("leads-class-hot"));

    expect(screen.getByTestId("lead-row-hot1")).toBeInTheDocument();
    expect(screen.queryByTestId("lead-row-cold1")).not.toBeInTheDocument();
    expect(screen.getByTestId("leads-count")).toHaveTextContent("1 of 2");
  });

  it("opens the detail drawer when a row is clicked", async () => {
    const user = userEvent.setup();
    render(<LeadsDashboard />);
    await waitFor(() => expect(screen.getByTestId("lead-row-hot1")).toBeInTheDocument());

    await user.click(screen.getByTestId("lead-row-hot1"));

    await waitFor(() => expect(screen.getByTestId("lead-detail-sheet")).toBeInTheDocument());
    expect(screen.getByTestId("extraction-panel")).toBeInTheDocument();
  });
});
