/**
 * The shapes olympus-service serves. Types only — no runtime code — so client
 * components can import them without dragging server-only modules into the bundle.
 *
 * These mirror com.experimentalneutron.olympus.domain. If they drift, the portal
 * renders nonsense: keep them in step with the service's JSON.
 */

export type ConsoleStatus = "live" | "planned";

export interface ConsoleEntry {
  id: string;
  name: string;
  blurb: string;
  href: string;
  namespace: string;
  service: string;
  accent: string;
  /** absent for single-accent consoles; the service omits it rather than sending null */
  accentAlt?: string;
  status: ConsoleStatus;
  /** in-cluster probe target — informational here, the service is what probes it */
  healthUrl: string;
  /** keyed god mark under public/brand/; none exist yet */
  mark?: string;
}

export type HealthState = "live" | "down" | "planned";

export interface HealthResult {
  id: string;
  state: HealthState;
  httpStatus?: number;
  latencyMs?: number;
  error?: string;
}

export interface HealthReport {
  checkedAt: string;
  results: HealthResult[];
}

/**
 * codex's status-of-record manifest (constellation.yaml), relayed by
 * olympus-service. Read-only: the board renders FROM this and never owns state,
 * so it cannot disagree with git.
 *
 * Fields are optional/defensive because codex owns the shape and it will grow —
 * a new key must not blank the board.
 */
export interface ConstellationComponent {
  repo: string;
  version?: string | null;
}

export interface ConstellationService {
  id: string;
  name?: string;
  status: string;
  owner?: string;
  priority?: string;
  domain?: string;
  components?: ConstellationComponent[];
  awaiting?: string;
  notes?: string;
  /** ares is Docker-Compose on a laptop — absent from k8s BY DESIGN, not missing */
  off_cluster?: boolean;
}

export interface ConstellationThread {
  id: string;
  name?: string;
  status?: string;
  domain?: string;
  notes?: string;
}

export interface ConstellationDecision {
  card?: string;
  question: string;
}

export interface ConstellationSpeculative {
  id: string;
  name?: string;
  idea?: string;
  verdict?: string;
  has_art?: boolean;
}

export interface Constellation {
  version?: number;
  updated?: string;
  lifecycle?: (string | { id: string; label?: string })[];
  services?: ConstellationService[];
  threads?: ConstellationThread[];
  speculative?: ConstellationSpeculative[];
  infra?: ConstellationService[];
  open_decisions?: ConstellationDecision[];
}
