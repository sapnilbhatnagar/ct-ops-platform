import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripsFlow } from "./trips-flow";
import { MOCK_ADMINS } from "@/lib/mock/admins";
import type { Lead } from "@/lib/types";

function lead(id: string, dest: string, budget: string): Lead {
  return {
    id,
    contactName: id[0].toUpperCase() + id.slice(1),
    phoneMasked: "+91 90••• ••000",
    language: "en",
    source: "meta_ad",
    status: "in_progress",
    classification: "warm",
    classificationSource: "model",
    assignedToId: null,
    extractedFields: [
      { key: "name", label: "Name", value: id, confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "destination", label: "Destination", value: dest, confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "travel_dates", label: "Travel dates", value: "flexible", confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "group_size", label: "Group size", value: "2", confidence: 0.9, extractedAtMessageIndex: 1 },
      { key: "budget", label: "Budget", value: budget, confidence: 0.9, extractedAtMessageIndex: 1 },
    ],
    messages: [],
    startedAt: "2026-05-01T00:00:00Z",
    lastActivityAt: "2026-05-01T00:00:00Z",
  };
}

const LEADS = [lead("goalover", "Goa beaches", "25000"), lead("keralafan", "Kerala", "5000")];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const body = url.includes("/api/admins") ? MOCK_ADMINS : LEADS;
      return Promise.resolve({ ok: true, json: async () => body });
    }),
  );
});

async function fillAndSubmitTrip(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId("trip-input-destination"), "Goa");
  await user.type(screen.getByTestId("trip-input-start"), "2026-12-04");
  await user.type(screen.getByTestId("trip-input-end"), "2026-12-10");
  await user.type(screen.getByTestId("trip-input-price"), "20000");
  await user.type(screen.getByTestId("trip-input-seats"), "12");
  await user.click(screen.getByTestId("trip-submit"));
}

describe("TripsFlow", () => {
  it("matches leads after submitting a trip", async () => {
    const user = userEvent.setup();
    render(<TripsFlow sendDelayMs={0} />);
    await waitFor(() => screen.getByTestId("trip-input-destination"));
    await fillAndSubmitTrip(user);

    await waitFor(() => expect(screen.getByTestId("match-preview")).toBeInTheDocument());
    // Goa lead matches on destination; Kerala lead has too-low budget → excluded
    expect(screen.getByTestId("match-card-goalover")).toBeInTheDocument();
    expect(screen.queryByTestId("match-card-keralafan")).not.toBeInTheDocument();
  });

  it("runs the full broadcast flow to a summary", async () => {
    const user = userEvent.setup();
    render(<TripsFlow sendDelayMs={0} />);
    await waitFor(() => screen.getByTestId("trip-input-destination"));
    await fillAndSubmitTrip(user);

    await waitFor(() => screen.getByTestId("broadcast-send"));
    await user.click(screen.getByTestId("broadcast-send"));

    await waitFor(() => expect(screen.getByTestId("broadcast-summary")).toBeInTheDocument());
    expect(screen.getByTestId("broadcast-summary")).toHaveTextContent("1 messages delivered");
  });
});
