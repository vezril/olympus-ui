/**
 * The service registry — static config, as scoped in olympus-service/README.md.
 * The codex `apps/` dir is the source of truth today; this mirrors it. If Olympus
 * ever reads live from k8s, this module is the seam to replace.
 *
 * Health targets are resolved server-side only. The default probe is `GET /` on the
 * console's in-cluster Service — the same thing the k8s readiness probe uses
 * (200-399 passes, per UI-PLAYBOOK.md), so it is known-good rather than guessed.
 * Point a console at a deeper endpoint with OLYMPUS_HEALTH_URL_<ID>, e.g.
 *   OLYMPUS_HEALTH_URL_HERMES=http://hermes-ui.hermes.svc.cluster.local/api/hermes/health
 */

export type ConsoleStatus = "live" | "planned";

export interface ConsoleEntry {
  /** god name, lowercase — the key everything else derives from */
  id: string;
  name: string;
  /** one line: what this console is for. Shown on the tile. */
  blurb: string;
  /** where the browser goes when the tile is clicked */
  href: string;
  /** k8s namespace, for the default in-cluster health target */
  namespace: string;
  /** in-cluster Service name */
  service: string;
  /** the god accent from UX-STANDARDS.md §2 — tints the mark slot only */
  accent: string;
  /** dual-accent services (dionysus, athena) only */
  accentAlt?: string;
  status: ConsoleStatus;
  /**
   * Keyed god mark under public/brand/. Left undefined until the real PNGs are
   * copied from codex `docs/brand/` — no logo beats a wrong logo.
   */
  mark?: string;
}

const DOMAIN = "home.experimentalneutron.com";

const href = (id: string) => `https://${id}.${DOMAIN}`;

export const REGISTRY: readonly ConsoleEntry[] = [
  {
    id: "dionysus",
    name: "Dionysus",
    blurb: "The flagship planner.",
    href: href("dionysus"),
    namespace: "dionysus",
    service: "dionysus-planner",
    accent: "oklch(0.85 0.2 195)",
    accentAlt: "oklch(0.7 0.28 340)",
    status: "live",
  },
  {
    id: "hermes",
    name: "Hermes",
    blurb: "Messaging and delivery.",
    href: href("hermes"),
    namespace: "hermes",
    service: "hermes-ui",
    accent: "oklch(0.8 0.25 145)",
    status: "live",
  },
  {
    id: "apollo",
    name: "Apollo",
    blurb: "Insight and forecasting.",
    href: href("apollo"),
    namespace: "apollo",
    service: "apollo-ui",
    accent: "oklch(0.9 0.12 95)",
    status: "live",
  },
  {
    id: "artemis",
    name: "Artemis",
    blurb: "Tracking and retrieval.",
    href: href("artemis"),
    namespace: "artemis",
    service: "artemis-ui",
    accent: "oklch(0.87 0.03 260)",
    status: "live",
  },
  {
    id: "demeter",
    name: "Demeter",
    blurb: "Yields and market prices.",
    href: href("demeter"),
    namespace: "demeter",
    service: "demeter-ui",
    accent: "oklch(0.8 0.16 85)",
    status: "live",
  },
  {
    id: "hera",
    name: "Hera",
    blurb: "Not yet built.",
    href: href("hera"),
    namespace: "hera",
    service: "hera-ui",
    accent: "oklch(0.78 0.1 25)",
    status: "planned",
  },
  {
    id: "poseidon",
    name: "Poseidon",
    blurb: "Not yet built.",
    href: href("poseidon"),
    namespace: "poseidon",
    service: "poseidon-ui",
    accent: "oklch(0.65 0.19 255)",
    status: "planned",
  },
  {
    id: "ares",
    name: "Ares",
    blurb: "Not yet built.",
    href: href("ares"),
    namespace: "ares",
    service: "ares-ui",
    accent: "oklch(0.6 0.23 20)",
    status: "planned",
  },
] as const;

export function liveConsoles(): ConsoleEntry[] {
  return REGISTRY.filter((c) => c.status === "live");
}

export function plannedConsoles(): ConsoleEntry[] {
  return REGISTRY.filter((c) => c.status === "planned");
}

export function findConsole(id: string): ConsoleEntry | undefined {
  return REGISTRY.find((c) => c.id === id);
}

/** Default in-cluster probe target for a console. */
export function defaultHealthUrl(entry: ConsoleEntry): string {
  return `http://${entry.service}.${entry.namespace}.svc.cluster.local/`;
}

/**
 * Runtime (server-side) env wins — chart values set these. NEXT_PUBLIC_* is
 * inlined at build time and must never be used for upstreams.
 */
export function healthUrlFor(
  entry: ConsoleEntry,
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const override = env[`OLYMPUS_HEALTH_URL_${entry.id.toUpperCase()}`];
  return override && override.trim().length > 0
    ? override.trim()
    : defaultHealthUrl(entry);
}
