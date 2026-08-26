"use client";

import * as React from "react";

import { HEALTH_ENDPOINT } from "@/lib/api";
import type { HealthReport, HealthResult } from "@/lib/health";

const REFRESH_MS = 30_000;

interface HealthContextValue {
  /** id -> result; absent means we have not heard yet */
  byId: Record<string, HealthResult>;
  checkedAt: string | null;
  /** true on the very first load, before any report has landed */
  loading: boolean;
  /** true while a refresh is in flight over existing data (async truthfulness) */
  syncing: boolean;
  /** the fan-out itself failed — distinct from "a console is down" */
  error: string | null;
  refresh: () => void;
}

const HealthContext = React.createContext<HealthContextValue | null>(null);

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [byId, setById] = React.useState<Record<string, HealthResult>>({});
  const [checkedAt, setCheckedAt] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const inFlight = React.useRef(false);

  const load = React.useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSyncing(true);
    try {
      const res = await fetch(HEALTH_ENDPOINT, { cache: "no-store" });
      if (!res.ok) throw new Error(`health check failed (HTTP ${res.status})`);
      const report: HealthReport = await res.json();
      setById(Object.fromEntries(report.results.map((r) => [r.id, r])));
      setCheckedAt(report.checkedAt);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "health check failed");
    } finally {
      inFlight.current = false;
      setSyncing(false);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();

    const tick = () => {
      if (document.visibilityState === "visible") void load();
    };
    const id = window.setInterval(tick, REFRESH_MS);

    // catch up immediately when the tab comes back rather than showing stale pills
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  const value = React.useMemo<HealthContextValue>(
    () => ({ byId, checkedAt, loading, syncing, error, refresh: () => void load() }),
    [byId, checkedAt, loading, syncing, error, load],
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth(): HealthContextValue {
  const ctx = React.useContext(HealthContext);
  if (!ctx) throw new Error("useHealth must be used inside <HealthProvider>");
  return ctx;
}

/**
 * Aggregate for the sidebar pill. "Some up" is degraded, not down — reporting
 * 2-of-5 as a flat Down would overstate the outage.
 */
export function summarize(byId: Record<string, HealthResult>): {
  up: number;
  total: number;
  state: "live" | "degraded" | "down" | "unknown";
} {
  const polled = Object.values(byId).filter((r) => r.state !== "planned");
  if (polled.length === 0) return { up: 0, total: 0, state: "unknown" };
  const up = polled.filter((r) => r.state === "live").length;
  const state = up === polled.length ? "live" : up === 0 ? "down" : "degraded";
  return { up, total: polled.length, state };
}
