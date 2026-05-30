"use client";

import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { TopBar } from "@/components/console-shell/topbar";
import { useLeads } from "@/lib/hooks/use-leads";
import { useAdmins } from "@/lib/hooks/use-admins";
import { LeadList } from "./lead-list";
import { ConversationThread } from "./conversation-thread";
import { ExtractionPanel } from "./extraction-panel";
import { HotLeadAlert } from "./hot-lead-alert";
import { FilterBar, type AssigneeFilter } from "./filter-bar";
import { Pagination } from "./pagination";
import { ClassificationControl } from "./classification-control";
import { AssignmentControl } from "./assignment-control";
import type { Classification, Lead } from "@/lib/types";

const PAGE_SIZE = 10;

export function IntakeConsole() {
  const { leads, loading: loadingLeads, updateLead, advanceConversation } = useLeads();
  const { admins } = useAdmins();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<Classification | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (classFilter !== "all" && l.classification !== classFilter) return false;
      if (assigneeFilter === "unassigned" && l.assignedToId !== null) return false;
      if (assigneeFilter !== "all" && assigneeFilter !== "unassigned" && l.assignedToId !== assigneeFilter)
        return false;
      return true;
    });
  }, [leads, classFilter, assigneeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [classFilter, assigneeFilter]);

  useEffect(() => {
    if (!selectedId && pageSlice.length > 0) {
      setSelectedId(pageSlice[0].id);
    }
  }, [pageSlice, selectedId]);

  const selectedLead: Lead | null = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  );

  const hasPending = Boolean(selectedLead?.pendingMessages?.length);

  return (
    <>
      <TopBar section="Intake" />
      <div className="flex min-h-0 flex-1">
        <div className="flex h-[calc(100dvh-3.5rem)] w-[320px] shrink-0 flex-col border-r border-rule bg-panel">
          <div className="border-b border-rule">
            <div className="flex items-baseline justify-between px-4 pt-3 pb-1">
              <div className="text-[11px] uppercase tracking-[0.18em] text-mute">
                Active conversations
              </div>
              <div className="text-[11px] tabular-nums text-mute">
                {loadingLeads ? "—" : `${filtered.length} of ${leads.length}`}
              </div>
            </div>
            <FilterBar
              classFilter={classFilter}
              onClassFilter={setClassFilter}
              assigneeFilter={assigneeFilter}
              onAssigneeFilter={setAssigneeFilter}
              admins={admins}
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <LeadList
              leads={pageSlice}
              admins={admins}
              selectedId={selectedId}
              onSelect={setSelectedId}
              loading={loadingLeads}
              emptyMessage={
                filtered.length === 0 && leads.length > 0
                  ? "No leads match the current filters."
                  : "No active intake conversations."
              }
            />
          </div>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col bg-paper">
          {!selectedLead ? (
            <div className="flex flex-1 items-center justify-center text-[13px] text-mute">
              {loadingLeads ? "Loading conversations…" : "Select a lead to view the conversation."}
            </div>
          ) : (
            <>
              <HotLeadAlert lead={selectedLead} />
              <div className="flex items-center justify-between border-b border-rule px-8 py-4">
                <div className="min-w-0">
                  <div className="font-display text-[20px] leading-tight text-ink">
                    {selectedLead.contactName ?? "Unnamed lead"}
                  </div>
                  <div className="mt-0.5 text-[12px] text-mute">
                    {selectedLead.phoneMasked} · {selectedLead.language} ·{" "}
                    {selectedLead.source.replace("_", " ")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AssignmentControl
                    assignedToId={selectedLead.assignedToId}
                    admins={admins}
                    onChange={(next) => updateLead(selectedLead.id, { assignedToId: next })}
                  />
                  <ClassificationControl
                    value={selectedLead.classification}
                    source={selectedLead.classificationSource}
                    onChange={(next) =>
                      updateLead(selectedLead.id, {
                        classification: next,
                        classificationSource: "user",
                      })
                    }
                  />
                  {hasPending ? (
                    <button
                      type="button"
                      onClick={() => advanceConversation(selectedLead.id)}
                      data-testid="advance-conversation"
                      className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-3.5 py-1.5 text-[12px] text-white transition-opacity hover:opacity-90"
                    >
                      <Play className="size-3" />
                      Simulate next message
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="flex min-h-0 flex-1 overflow-y-auto">
                <ConversationThread messages={selectedLead.messages} />
              </div>
            </>
          )}
        </div>

        {selectedLead ? (
          <ExtractionPanel
            fields={selectedLead.extractedFields}
            classification={selectedLead.classification}
            classificationReason={selectedLead.classificationReason}
          />
        ) : null}
      </div>
    </>
  );
}
