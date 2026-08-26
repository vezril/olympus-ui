/**
 * Same-origin BFF base. RELATIVE by design: a relative path makes the image
 * environment-agnostic, which is the whole point of baking it at build time.
 *
 * NEXT_PUBLIC_* is inlined into the browser bundle by `next build` — a chart or
 * runtime env for it is inert (this is the bug zeus-ui shipped). It is set as an
 * ARG/ENV in the Dockerfile BUILDER stage, and the build asserts it landed.
 */
export const API_BASE = process.env.NEXT_PUBLIC_OLYMPUS_API_BASE ?? "/api/olympus";

export const HEALTH_ENDPOINT = `${API_BASE}/health`;
