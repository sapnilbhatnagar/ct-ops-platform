import { cn } from "@/lib/utils";
import type { Classification } from "@/lib/types";

const LABEL: Record<Classification, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
  unclassified: "Qualifying",
};

const TONE: Record<Classification, string> = {
  hot: "bg-hot text-white",
  warm: "bg-warm text-white",
  cold: "bg-cold text-white",
  unclassified: "bg-rule text-mute",
};

export function ClassificationBadge({
  value,
  size = "md",
  className,
}: {
  value: Classification;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      data-testid="classification-badge"
      data-classification={value}
      className={cn(
        "inline-flex items-center rounded-full font-medium tracking-wide uppercase",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        TONE[value],
        className,
      )}
    >
      {LABEL[value]}
    </span>
  );
}
