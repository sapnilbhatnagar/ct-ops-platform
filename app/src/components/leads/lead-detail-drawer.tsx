"use client";

import { Sheet } from "@/components/ui/sheet";
import { ConversationThread } from "@/components/intake/conversation-thread";
import { ClassificationControl } from "@/components/intake/classification-control";
import { AssignmentControl } from "@/components/intake/assignment-control";
import { ExtractionPanel } from "@/components/intake/extraction-panel";
import { HotLeadAlert } from "@/components/intake/hot-lead-alert";
import type { Lead, Admin } from "@/lib/types";

export function LeadDetailDrawer({
  lead,
  admins,
  onUpdate,
  onOpenChange,
}: {
  lead: Lead | null;
  admins: Admin[];
  onUpdate: (id: string, partial: Partial<Lead>) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={lead !== null} onOpenChange={onOpenChange} label="Lead detail">
      {lead ? (
        <div className="flex h-full min-h-0 flex-col">
          <HotLeadAlert lead={lead} />
          <div className="flex items-start justify-between gap-4 border-b border-rule px-6 py-4 pr-14">
            <div className="min-w-0">
              <div className="font-display text-[20px] leading-tight text-ink">
                {lead.contactName ?? "Unnamed lead"}
              </div>
              <div className="mt-0.5 text-[12px] text-mute">
                {lead.phoneMasked} · {lead.language} · {lead.source.replace("_", " ")}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <AssignmentControl
                assignedToId={lead.assignedToId}
                admins={admins}
                onChange={(next) => onUpdate(lead.id, { assignedToId: next })}
              />
              <ClassificationControl
                value={lead.classification}
                source={lead.classificationSource}
                onChange={(next) =>
                  onUpdate(lead.id, { classification: next, classificationSource: "user" })
                }
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-1">
            <div className="min-w-0 flex-1 overflow-y-auto">
              {lead.messages.length > 0 ? (
                <ConversationThread messages={lead.messages} />
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center text-[13px] text-mute">
                  No conversation transcript stored for this lead yet.
                </div>
              )}
            </div>
            <ExtractionPanel
              fields={lead.extractedFields}
              classification={lead.classification}
              classificationReason={lead.classificationReason}
            />
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}
