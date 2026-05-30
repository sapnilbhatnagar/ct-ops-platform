"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import type { Lead } from "@/lib/types";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function HotLeadAlert({ lead }: { lead: Lead }) {
  const visible = lead.classification === "hot" && lead.agentNotifiedAt;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          data-testid="hot-lead-alert"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-3 border-b border-hot/20 bg-hot/8 px-8 py-3"
        >
          <Flame className="size-4 shrink-0 text-hot" />
          <div className="flex-1 text-[13px] text-ink">
            <span className="font-medium">Hot lead</span>{" "}
            <span className="text-mute">· agent notified at {formatTime(lead.agentNotifiedAt!)}</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
