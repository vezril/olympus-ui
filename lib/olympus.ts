/**
 * Client for olympus-service. Server-side only: the browser never talks to the
 * service directly, it talks to this app's BFF, which talks to the service.
 *
 * olympus-service owns the registry and the health fan-out. This module is a
 * thin, honest transport — it does not cache, retry, or invent data when the
 * service is unreachable. A failure here is a failure the portal must show.
 */
import "server-only";

import type { ConsoleEntry, HealthReport } from "@/lib/types";

const DEFAULT_SERVICE_URL = "http://olympus-service.olympus.svc.cluster.local";
const DEFAULT_TIMEOUT_MS = 4000;

export class OlympusServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OlympusServiceError";
  }
}

/** Runtime env — chart values set this. Never NEXT_PUBLIC_*. */
export function serviceUrl(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const raw = env.OLYMPUS_SERVICE_URL;
  const url = raw && raw.trim().length > 0 ? raw.trim() : DEFAULT_SERVICE_URL;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function timeoutMs(
  env: Readonly<Record<string, string | undefined>> = process.env,
): number {
  const raw = Number(env.OLYMPUS_SERVICE_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

export function describeError(err: unknown): string {
  if (err instanceof OlympusServiceError) return err.message;
  if (err instanceof DOMException && err.name === "TimeoutError") {
    return "olympus-service timed out";
  }
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: unknown }).cause;
    if (cause instanceof Error && cause.message) return cause.message;
    return err.message;
  }
  return "olympus-service is unreachable";
}

async function get<T>(path: string): Promise<T> {
  const url = `${serviceUrl()}${path}`;

  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs()),
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    throw new OlympusServiceError(`olympus-service answered HTTP ${res.status} for ${path}`);
  }

  return (await res.json()) as T;
}

/** The registry. Throws if the service cannot answer — the caller renders that. */
export async function fetchConsoles(): Promise<ConsoleEntry[]> {
  const consoles = await get<ConsoleEntry[]>("/consoles");
  if (!Array.isArray(consoles)) {
    throw new OlympusServiceError("olympus-service returned a malformed registry");
  }
  return consoles;
}

/** The aggregated fan-out. The service does the probing; this just relays it. */
export async function fetchHealth(): Promise<HealthReport> {
  const report = await get<HealthReport>("/health/consoles");
  if (!report || !Array.isArray(report.results)) {
    throw new OlympusServiceError("olympus-service returned a malformed health report");
  }
  return report;
}

export function liveConsoles(consoles: ConsoleEntry[]): ConsoleEntry[] {
  return consoles.filter((c) => c.status === "live");
}

export function plannedConsoles(consoles: ConsoleEntry[]): ConsoleEntry[] {
  return consoles.filter((c) => c.status === "planned");
}
