import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LeadSummary } from "./lead-summary";
import type { Message } from "@/lib/types";

const messages: Message[] = [
  { id: "1", role: "user", content: "Hi, want to go to Goa", timestamp: "", type: "text" },
  { id: "2", role: "agent", content: "Great, when?", timestamp: "", type: "text" },
];

describe("LeadSummary", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ summary: "Goa trip, dates TBD.", nextAction: "Ask for travel dates." }),
      }),
    );
  });

  it("renders the summary and next action after loading", async () => {
    render(<LeadSummary leadId="l1" messages={messages} />);
    await waitFor(() => expect(screen.getByText("Goa trip, dates TBD.")).toBeInTheDocument());
    expect(screen.getByText(/Ask for travel dates/)).toBeInTheDocument();
  });

  it("renders nothing when there is no transcript", () => {
    const { container } = render(<LeadSummary leadId="l1" messages={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides itself when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));
    const { container } = render(<LeadSummary leadId="l1" messages={messages} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
