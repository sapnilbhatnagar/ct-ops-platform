import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminsPanel } from "./admins-panel";
import { MOCK_ADMINS } from "@/lib/mock/admins";

// Mock fetch so useAdmins gets mock data instead of hitting a real server.
// The hook caches after the first load, so subsequent tests render immediately.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_ADMINS,
    }),
  );
});

describe("AdminsPanel", () => {
  it("renders the seeded admins after load", async () => {
    render(<AdminsPanel />);
    await waitFor(() =>
      expect(screen.getByTestId("admin-row-admin_sapnil")).toBeInTheDocument(),
    );
    expect(screen.getByText(/Sapnil Bhatnagar/)).toBeInTheDocument();
  });

  it("validates the email field", async () => {
    const user = userEvent.setup();
    render(<AdminsPanel />);
    await waitFor(() => screen.getByTestId("admin-row-admin_sapnil"));
    await user.type(screen.getByTestId("admin-input-name"), "Test User");
    await user.type(screen.getByTestId("admin-input-email"), "not-an-email");
    await user.click(screen.getByTestId("admin-submit"));
    expect(screen.getByTestId("admin-error")).toHaveTextContent(/doesn't look right/i);
  });

  it("rejects duplicate emails", async () => {
    const user = userEvent.setup();
    render(<AdminsPanel />);
    await waitFor(() => screen.getByTestId("admin-row-admin_sapnil"));
    await user.type(screen.getByTestId("admin-input-name"), "Another Sapnil");
    await user.type(
      screen.getByTestId("admin-input-email"),
      "sapnil@connectingtraveller.com",
    );
    await user.click(screen.getByTestId("admin-submit"));
    expect(screen.getByTestId("admin-error")).toHaveTextContent(/already on the team/i);
  });
});
