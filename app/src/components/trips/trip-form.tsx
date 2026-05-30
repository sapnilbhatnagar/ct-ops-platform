"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import type { Trip } from "@/lib/trip-matching";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-mute">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-rule bg-paper px-3 py-2 text-[13px] text-ink placeholder:text-mute/60 focus:outline-none";

export function TripForm({ onSubmit }: { onSubmit: (trip: Trip) => void }) {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [seats, setSeats] = useState("");
  const [highlights, setHighlights] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!destination.trim() || !startDate || !endDate || !price || !seats) {
      setError("Destination, dates, price, and seats are all required.");
      return;
    }
    if (endDate < startDate) {
      setError("The end date can't be before the start date.");
      return;
    }
    setError(null);
    onSubmit({
      destination: destination.trim(),
      startDate,
      endDate,
      pricePerPerson: Number(price),
      seats: Number(seats),
      highlights: highlights.trim(),
      offerDeadline: deadline || startDate,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-5">
      <Field label="Destination">
        <input
          data-testid="trip-input-destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Rajasthan"
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Start date">
          <input
            type="date"
            data-testid="trip-input-start"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="End date">
          <input
            type="date"
            data-testid="trip-input-end"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Price / person (₹)">
          <input
            type="number"
            data-testid="trip-input-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="20000"
            className={inputCls}
          />
        </Field>
        <Field label="Seats">
          <input
            type="number"
            data-testid="trip-input-seats"
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            placeholder="12"
            className={inputCls}
          />
        </Field>
        <Field label="Offer deadline">
          <input
            type="date"
            data-testid="trip-input-deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Highlights">
        <textarea
          data-testid="trip-input-highlights"
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
          placeholder="Forts, desert safari, palace stay"
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </Field>

      {error ? (
        <div data-testid="trip-error" className="text-[12.5px] text-accent">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          data-testid="trip-submit"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          <Send className="size-3.5" />
          Find matching leads
        </button>
      </div>
    </form>
  );
}
