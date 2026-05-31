import { describe, it, expect } from "vitest";
import { seatDelta, applyBooking } from "./booking";

describe("seatDelta", () => {
  it("books a seat, frees a seat, and no-ops within the counted set", () => {
    expect(seatDelta("enquiry", "booked")).toBe(1);
    expect(seatDelta("enquiry", "travelled")).toBe(1);
    expect(seatDelta("booked", "enquiry")).toBe(-1);
    expect(seatDelta("travelled", "enquiry")).toBe(-1);
    expect(seatDelta("booked", "travelled")).toBe(0);
    expect(seatDelta("enquiry", "enquiry")).toBe(0);
  });
});

describe("applyBooking", () => {
  it("increments and decrements seatsBooked", () => {
    expect(applyBooking(4, 12, "enquiry", "booked")).toBe(5);
    expect(applyBooking(4, 12, "booked", "enquiry")).toBe(3);
  });

  it("never exceeds seatsTotal and never drops below zero", () => {
    expect(applyBooking(12, 12, "enquiry", "booked")).toBe(12);
    expect(applyBooking(0, 12, "booked", "enquiry")).toBe(0);
  });

  it("has no upper clamp when seatsTotal is null", () => {
    expect(applyBooking(99, null, "enquiry", "booked")).toBe(100);
  });
});
