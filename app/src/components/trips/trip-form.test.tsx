import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripForm } from "./trip-form";

describe("TripForm", () => {
  it("shows a validation error when required fields are missing", async () => {
    const user = userEvent.setup();
    render(<TripForm onSubmit={vi.fn()} />);
    await user.click(screen.getByTestId("trip-submit"));
    expect(screen.getByTestId("trip-error")).toBeInTheDocument();
  });

  it("submits a parsed trip when the form is valid", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TripForm onSubmit={onSubmit} />);

    await user.type(screen.getByTestId("trip-input-destination"), "Rajasthan");
    await user.type(screen.getByTestId("trip-input-start"), "2026-10-04");
    await user.type(screen.getByTestId("trip-input-end"), "2026-10-10");
    await user.type(screen.getByTestId("trip-input-price"), "20000");
    await user.type(screen.getByTestId("trip-input-seats"), "12");
    await user.type(screen.getByTestId("trip-input-highlights"), "Forts and desert safari");
    await user.type(screen.getByTestId("trip-input-deadline"), "2026-09-15");
    await user.click(screen.getByTestId("trip-submit"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const trip = onSubmit.mock.calls[0][0];
    expect(trip.destination).toBe("Rajasthan");
    expect(trip.pricePerPerson).toBe(20000);
    expect(trip.seats).toBe(12);
  });
});
