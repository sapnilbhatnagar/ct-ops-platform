"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, CircleDashed } from "lucide-react";
import type { ExtractedField, Classification } from "@/lib/types";
import { ClassificationBadge } from "./classification-badge";

function ConfidenceDot({ confidence }: { confidence: number | null }) {
  if (confidence === null) return null;
  const pct = Math.round(confidence * 100);
  const tone =
    confidence >= 0.85 ? "text-ok" : confidence >= 0.6 ? "text-warm" : "text-mute";
  return (
    <span className={`text-[11px] tabular-nums ${tone}`} title={`Confidence ${pct}%`}>
      {pct}%
    </span>
  );
}

function FieldRow({ field }: { field: ExtractedField }) {
  const extracted = field.value !== null;
  return (
    <li
      data-testid={`field-${field.key}`}
      data-state={extracted ? "extracted" : "pending"}
      className="flex items-start justify-between gap-4 py-3.5"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`mt-0.5 flex size-4 items-center justify-center rounded-full ${
            extracted ? "text-ok" : "text-mute/60"
          }`}
        >
          {extracted ? <Check className="size-3.5" /> : <CircleDashed className="size-3.5" />}
        </span>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.14em] text-mute">
            {field.label}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={field.value ?? "empty"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-0.5 text-[14.5px] leading-snug text-ink"
            >
              {field.value ?? <span className="text-mute/60">—</span>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <ConfidenceDot confidence={field.confidence} />
    </li>
  );
}

export function ExtractionPanel({
  fields,
  classification,
  classificationReason,
}: {
  fields: ExtractedField[];
  classification: Classification;
  classificationReason?: string;
}) {
  const completed = fields.filter((f) => f.value !== null).length;

  return (
    <aside
      data-testid="extraction-panel"
      className="flex h-full w-[340px] shrink-0 flex-col border-l border-rule bg-panel"
    >
      <div className="border-b border-rule px-6 pt-6 pb-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-mute">
          Live extraction
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <div className="font-display text-[22px] leading-tight">
            {completed} of {fields.length}
          </div>
          <ClassificationBadge value={classification} />
        </div>
        {classificationReason ? (
          <p className="mt-3 text-[12.5px] leading-relaxed text-mute">
            {classificationReason}
          </p>
        ) : null}
      </div>

      <ul className="flex-1 divide-y divide-rule px-6">
        {fields.map((f) => (
          <FieldRow key={f.key} field={f} />
        ))}
      </ul>
    </aside>
  );
}
