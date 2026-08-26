/**
 * Server-side health fan-out. The browser never talks to a console directly —
 * it calls this app's own /api/olympus/health, which probes in-cluster.
 * (UI-PLAYBOOK.md: same-origin BFF, no CORS, no service exposure.)
 */
import "server-only";

import {
  type ConsoleEntry,
  REGISTRY,
  healthUrlFor,
  liveConsoles,
} from "@/lib/registry";

export type HealthState = "live" | "down" | "planned";

export interface HealthResult {
  id: string;
  state: HealthState;
  /** HTTP status when we got a response at all */
  httpStatus?: number;
  latencyMs?: number;
  /** why it is down — surfaced in the tile's error state, never swallowed */
  error?: string;
}

export interface HealthReport {
  checkedAt: string;
  results: HealthResult[];
}

const DEFAULT_TIMEOUT_MS = 3000;

function timeoutMs(env: Readonly<Record<string, string | undefined>> = process.env): number {
  const raw = Number(env.OLYMPUS_HEALTH_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

/** 200-399 passes, matching the k8s probe convention. */
export function isHealthyStatus(status: number): boolean {
  return status >= 200 && status < 400;
}

export function describeError(err: unknown): string {
  if (err instanceof DOMException && err.name === "TimeoutError") {
    return "timed out";
  }
  if (err instanceof Error) {
    // fetch wraps the real cause; the cause is the useful half
    const cause = (err as Error & { cause?: unknown }).cause;
    if (cause instanceof Error && cause.message) return cause.message;
    return err.message;
  }
  return "unreachable";
}

export async function probe(entry: ConsoleEntry): Promise<HealthResult> {
  if (entry.status === "planned") {
    return { id: entry.id, state: "planned" };
  }

  const url = healthUrlFor(entry);
  const started = performance.now();

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs()),
      headers: { "user-agent": "olympus-ui/health" },
    });
    const latencyMs = Math.round(performance.now() - started);
    return {
      id: entry.id,
      state: isHealthyStatus(res.status) ? "live" : "down",
      httpStatus: res.status,
      latencyMs,
      ...(isHealthyStatus(res.status) ? {} : { error: `HTTP ${res.status}` }),
    };
  } catch (err) {
    return {
      id: entry.id,
      state: "down",
      latencyMs: Math.round(performance.now() - started),
      error: describeError(err),
    };
  }
}

/** Probes every live console in parallel. Never throws — a dead console is data. */
export async function checkAll(
  entries: ConsoleEntry[] = liveConsoles(),
): Promise<HealthReport> {
  const settled = await Promise.allSettled(entries.map(probe));

  const results = settled.map((outcome, i) =>
    outcome.status === "fulfilled"
      ? outcome.value
      : {
          id: entries[i].id,
          state: "down" as const,
          error: describeError(outcome.reason),
        },
  );

  const planned = REGISTRY.filter((c) => c.status === "planned").map((c) => ({
    id: c.id,
    state: "planned" as const,
  }));

  return {
    checkedAt: new Date().toISOString(),
    results: [...results, ...planned],
  };
}
