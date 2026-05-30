"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (next: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = pageNumbers(page, totalPages);

  return (
    <div
      data-testid="pagination"
      className="flex items-center justify-between border-t border-rule px-4 py-2"
    >
      <div className="text-[11px] tabular-nums text-mute">
        {total === 0 ? "0 leads" : `${start}–${end} of ${total}`}
      </div>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          data-testid="pagination-prev"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="inline-flex size-6 items-center justify-center rounded text-mute transition-colors hover:bg-rule/40 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-[11px] text-mute">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              data-testid={`pagination-page-${p}`}
              data-active={p === page}
              onClick={() => onPageChange(p)}
              className={cn(
                "inline-flex size-6 items-center justify-center rounded text-[11px] tabular-nums transition-colors",
                p === page ? "bg-accent text-white" : "text-mute hover:bg-rule/40 hover:text-ink",
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          data-testid="pagination-next"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="inline-flex size-6 items-center justify-center rounded text-mute transition-colors hover:bg-rule/40 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Next page"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const result: (number | "…")[] = [1];
  if (current > 3) result.push("…");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) result.push(i);
  if (current < total - 2) result.push("…");
  result.push(total);
  return result;
}
