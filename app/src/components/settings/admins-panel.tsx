"use client";

import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { useAdmins } from "@/lib/hooks/use-admins";
import { AdminAvatar } from "@/components/intake/admin-avatar";

export function AdminsPanel() {
  const { admins, loading, addAdmin, removeAdmin } = useAdmins();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Name and email are both required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That email doesn't look right.");
      return;
    }
    if (admins.some((a) => a.email.toLowerCase() === email.trim().toLowerCase())) {
      setError("Someone with that email is already on the team.");
      return;
    }
    try {
      await addAdmin({ name: name.trim(), email: email.trim() });
      setName("");
      setEmail("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add admin.");
    }
  }

  return (
    <div className="space-y-8">
      <section data-testid="admins-list">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[13px] font-medium text-ink">Current team</h2>
          <div className="text-[11px] tabular-nums text-mute">
            {loading ? "—" : `${admins.length} admin${admins.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <ul className="divide-y divide-rule tile">
          {loading ? (
            <li className="px-4 py-4 text-[12.5px] text-mute">Loading…</li>
          ) : admins.length === 0 ? (
            <li className="px-4 py-6 text-center text-[13px] text-mute">No admins yet.</li>
          ) : (
            admins.map((a) => (
              <li
                key={a.id}
                data-testid={`admin-row-${a.id}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <AdminAvatar admin={a} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] text-ink">{a.name}</div>
                  <div className="truncate text-[11.5px] text-mute">{a.email}</div>
                </div>
                <button
                  type="button"
                  data-testid={`remove-admin-${a.id}`}
                  onClick={() => removeAdmin(a.id)}
                  className="inline-flex size-7 items-center justify-center rounded-md text-mute transition-colors hover:bg-rule/40 hover:text-ink"
                  aria-label={`Remove ${a.name}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section data-testid="admins-add">
        <h2 className="mb-3 text-[13px] font-medium text-ink">Add a teammate</h2>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="tile p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-mute">
                Name
              </span>
              <input
                type="text"
                data-testid="admin-input-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Iyer"
                className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-[13px] text-ink placeholder:text-mute/60 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-mute">
                Email
              </span>
              <input
                type="email"
                data-testid="admin-input-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@connectingtraveller.com"
                className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-[13px] text-ink placeholder:text-mute/60 focus:outline-none"
              />
            </label>
          </div>
          {error ? (
            <div data-testid="admin-error" className="mt-3 text-[12px] text-accent">
              {error}
            </div>
          ) : null}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              data-testid="admin-submit"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <UserPlus className="size-3.5" />
              Add admin
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
