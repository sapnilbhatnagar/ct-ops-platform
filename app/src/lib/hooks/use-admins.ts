"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Admin } from "@/lib/types";

type AdminsState = {
  admins: Admin[];
  loading: boolean;
  error: string | null;
};

let _cache: Admin[] | null = null;
const _subscribers = new Set<(next: Admin[]) => void>();

function publish(next: Admin[]) {
  _cache = next;
  for (const s of _subscribers) s([...next]);
}

async function fetchAdmins(): Promise<Admin[]> {
  const res = await fetch("/api/admins");
  if (!res.ok) throw new Error(`/api/admins returned ${res.status}`);
  return res.json() as Promise<Admin[]>;
}

export function useAdmins(): AdminsState & {
  addAdmin: (input: { name: string; email: string }) => Promise<void>;
  removeAdmin: (id: string) => Promise<void>;
} {
  const [admins, setAdmins] = useState<Admin[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const onChange = (next: Admin[]) => {
      if (mounted.current) setAdmins(next);
    };
    _subscribers.add(onChange);

    if (_cache === null) {
      fetchAdmins()
        .then((data) => {
          publish(data);
          if (mounted.current) setLoading(false);
        })
        .catch((e: unknown) => {
          if (mounted.current) {
            setError(e instanceof Error ? e.message : "Failed to load admins");
            setLoading(false);
          }
        });
    }

    return () => {
      mounted.current = false;
      _subscribers.delete(onChange);
    };
  }, []);

  const addAdmin = useCallback(async ({ name, email }: { name: string; email: string }) => {
    const res = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "Failed to add admin");
    }
    const newAdmin = (await res.json()) as Admin;
    // In mock mode the API returns {ok:true} not an Admin; fall back gracefully
    if (newAdmin && "id" in newAdmin) {
      publish([...(_cache ?? []), newAdmin]);
    } else {
      // Refresh from server
      const data = await fetchAdmins();
      publish(data);
    }
  }, []);

  const removeAdmin = useCallback(async (id: string) => {
    // Optimistic
    if (_cache) publish(_cache.filter((a) => a.id !== id));
    try {
      await fetch(`/api/admins/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("[useAdmins] removeAdmin failed:", e);
      // Revert on failure
      const data = await fetchAdmins();
      publish(data);
    }
  }, []);

  return { admins, loading, error, addAdmin, removeAdmin };
}

export function findAdmin(admins: Admin[], id: string | null): Admin | null {
  if (!id) return null;
  return admins.find((a) => a.id === id) ?? null;
}
