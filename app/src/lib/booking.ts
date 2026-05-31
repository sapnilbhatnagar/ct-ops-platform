import type { BookingStatus } from "./types";

/** booked + travelled occupy a seat; enquiry does not. */
export function countsAsSeat(s: BookingStatus): boolean {
  return s === "booked" || s === "travelled";
}

export function seatDelta(from: BookingStatus, to: BookingStatus): -1 | 0 | 1 {
  return ((countsAsSeat(to) ? 1 : 0) - (countsAsSeat(from) ? 1 : 0)) as -1 | 0 | 1;
}

/** New seatsBooked after a transition, clamped to [0, seatsTotal] (no upper clamp when null). */
export function applyBooking(
  seatsBooked: number,
  seatsTotal: number | null,
  from: BookingStatus,
  to: BookingStatus,
): number {
  const next = Math.max(0, seatsBooked + seatDelta(from, to));
  return seatsTotal != null ? Math.min(seatsTotal, next) : next;
}
