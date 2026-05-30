"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useCampaigns } from "@/lib/hooks/use-campaigns";

export function CriteriaConfigurator() {
  const { campaigns, activeCampaign, setActive, create, addParam, removeParam } = useCampaigns();
  const [newParam, setNewParam] = useState("");
  const [newCampaign, setNewCampaign] = useState("");
  const [adding, setAdding] = useState(false);

  function submitParam(e: React.FormEvent) {
    e.preventDefault();
    if (!newParam.trim()) return;
    addParam(newParam);
    setNewParam("");
  }

  function submitCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!newCampaign.trim()) return;
    create(newCampaign);
    setNewCampaign("");
    setAdding(false);
  }

  return (
    <div className="max-w-2xl space-y-6" data-testid="criteria-configurator">
      {/* Campaign selector */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-mute">Campaign</span>
          <select
            data-testid="campaign-select"
            value={activeCampaign.id}
            onChange={(e) => setActive(e.target.value)}
            className="rounded-xl border border-rule bg-tile px-3 py-2 text-[13px] text-ink focus:outline-none"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {adding ? (
          <form onSubmit={submitCampaign} className="flex items-end gap-2">
            <input
              autoFocus
              data-testid="new-campaign-input"
              value={newCampaign}
              onChange={(e) => setNewCampaign(e.target.value)}
              placeholder="Campaign name"
              className="rounded-xl border border-rule bg-tile px-3 py-2 text-[13px] text-ink placeholder:text-mute/60 focus:outline-none"
            />
            <button
              type="submit"
              data-testid="create-campaign"
              className="rounded-xl bg-accent px-3 py-2 text-[12.5px] font-medium text-white"
            >
              Create
            </button>
          </form>
        ) : (
          <button
            type="button"
            data-testid="new-campaign"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-tile px-3 py-2 text-[12.5px] text-ink-soft transition-colors hover:text-ink"
          >
            <Plus className="size-3.5" />
            New campaign
          </button>
        )}
      </div>

      {/* Criteria list */}
      <div className="tile overflow-hidden" data-testid="criteria-list">
        <ul className="divide-y divide-rule">
          {activeCampaign.criteria.map((c) => (
            <li
              key={c.key}
              data-testid={`criterion-${c.key}`}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-accent-quiet text-accent">
                <Check className="size-3" />
              </span>
              <span className="flex-1 text-[13.5px] text-ink">{c.label}</span>
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-mute">
                {c.custom ? "Custom" : "Default"}
              </span>
              {c.custom ? (
                <button
                  type="button"
                  data-testid={`remove-criterion-${c.key}`}
                  onClick={() => removeParam(c.key)}
                  aria-label={`Remove ${c.label}`}
                  className="inline-flex size-7 items-center justify-center rounded-md text-mute transition-colors hover:bg-rule/50 hover:text-hot"
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : (
                <span className="inline-block size-7" />
              )}
            </li>
          ))}
        </ul>

        <form onSubmit={submitParam} className="flex items-center gap-2 border-t border-rule bg-canvas/60 px-4 py-3">
          <input
            data-testid="criterion-input"
            value={newParam}
            onChange={(e) => setNewParam(e.target.value)}
            placeholder="Add a parameter, e.g. Occasion, Past traveller"
            className="flex-1 rounded-lg border border-rule bg-tile px-3 py-2 text-[13px] text-ink placeholder:text-mute/60 focus:outline-none"
          />
          <button
            type="submit"
            data-testid="add-criterion"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="size-3.5" />
            Add
          </button>
        </form>
      </div>

      <p className="text-[12px] leading-relaxed text-mute">
        These parameters drive the Live extraction panel on the Intake screen, and the AI intake
        agent extracts them from new WhatsApp conversations. Saved per campaign in Airtable.
      </p>
    </div>
  );
}
