import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripsFlow } from "./trips-flow";
import type { ReengagementMatch } from "@/lib/trip-matching";

const MATCH: ReengagementMatch = {
  id: "goalover",
  contactName: "Goalover",
  phoneMasked: "+91 90••• ••000",
  classification: "warm",
  reason: "Asked about Goa beaches",
  message: "Hi Goalover! We just opened a Goa trip…",
  messageSource: "model",
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/trips/match")) {
        return Promise.resolve({ ok: true, json: async () => [MATCH] });
      }
      if (url.includes("/api/trips/broadcast")) {
        return Promise.resolve({ ok: true, json: async () => ({ sent: 1, failed: 0 }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
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
  it("matches leads via the API after submitting a trip", async () => {
    const user = userEvent.setup();
    render(<TripsFlow />);
    await fillAndSubmitTrip(user);

    await waitFor(() => expect(screen.getByTestId("match-preview")).toBeInTheDocument());
    expect(screen.getByTestId("match-card-goalover")).toBeInTheDocument();
    expect(screen.getByText(/We just opened a Goa trip/)).toBeInTheDocument();
  });

  it("runs the broadcast to a summary", async () => {
    const user = userEvent.setup();
    render(<TripsFlow />);
    await fillAndSubmitTrip(user);

    await waitFor(() => screen.getByTestId("broadcast-send"));
    await user.click(screen.getByTestId("broadcast-send"));

    await waitFor(() => expect(screen.getByTestId("broadcast-summary")).toBeInTheDocument());
    expect(screen.getByTestId("broadcast-summary")).toHaveTextContent("1 messages delivered");
  });
});
