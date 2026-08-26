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
