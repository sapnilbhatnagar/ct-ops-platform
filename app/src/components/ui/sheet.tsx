"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Right-side sheet built on Radix Dialog. Used for the lead detail drawer.
 * Controlled via `open` / `onOpenChange`.
 */
export function Sheet({
  open,
  onOpenChange,
  children,
  className,
  label,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          data-testid="lead-detail-sheet"
          aria-label={label}
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full max-w-[760px] flex-col bg-paper shadow-2xl outline-none",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-right",
            className,
          )}
        >
          <Dialog.Title className="sr-only">{label}</Dialog.Title>
          <Dialog.Close
            data-testid="lead-detail-close"
            className="absolute right-4 top-4 z-10 inline-flex size-8 items-center justify-center rounded-full text-mute transition-colors hover:bg-rule/40 hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
