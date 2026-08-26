import type {
  Constellation,
  ConstellationService,
} from "@/lib/types";

/**
 * Shaping the manifest into columns. Pure functions, no fetching — the board is a
 * projection of codex's manifest and nothing here invents state.
 */

export interface Column {
  id: string;
  label: string;
  services: ConstellationService[];
}

const TITLES: Record<string, string> = {
  live: "Live",
  building: "Building",
  seeded: "Seeded",
  designed: "Designed",
  parked: "Parked",
  speculative: "Speculative",
};

export function columnId(entry: string | { id: string; label?: string }): string {
  return typeof entry === "string" ? entry : entry.id;
}

export function columnLabel(entry: string | { id: string; label?: string }): string {
  if (typeof entry !== "string" && entry.label) return entry.label;
  const id = columnId(entry);
  return TITLES[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

/**
 * Columns in the manifest's declared order, each carrying its services.
 *
 * A service whose status names no column would otherwise vanish silently, so it
 * is surfaced in a trailing column rather than dropped — the board must not hide
 * what the manifest says.
 */
export function toColumns(manifest: Constellation): Column[] {
  const lifecycle = manifest.lifecycle ?? [];
  const services = manifest.services ?? [];

  const columns: Column[] = lifecycle.map((entry) => ({
    id: columnId(entry),
    label: columnLabel(entry),
    services: services.filter((s) => s.status === columnId(entry)),
  }));

  const known = new Set(columns.map((c) => c.id));
  const orphans = services.filter((s) => !known.has(s.status));
  if (orphans.length > 0) {
    columns.push({ id: "__unmapped", label: "Unmapped status", services: orphans });
  }

  return columns;
}

/** "hermes-ui 0.1.8 · hermes-service 0.2.0", or null when nothing is versioned. */
export function componentSummary(service: ConstellationService): string | null {
  const parts = (service.components ?? [])
    .filter((c) => c.repo)
    .map((c) => (c.version ? `${c.repo} ${c.version}` : `${c.repo} —`));
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function serviceName(service: ConstellationService): string {
  return service.name ?? service.id;
}
