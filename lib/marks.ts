/**
 * Which consoles have a keyed god mark shipped in public/brand/.
 *
 * The mark is a UI ASSET, not registry data — olympus-service has no business
 * knowing this app's public paths — so the path is derived from the console id
 * here rather than served. This set is the guard: without it a console with no
 * mark would request a 404 and render a broken image, which is worse than the
 * accent slot it falls back to.
 *
 * Adding a mark: key it transparent from codex `docs/brand/<god>.jpeg` with
 * that repo's key_transparent.py, drop the PNG in public/brand/, add the id here.
 */
const SHIPPED = new Set([
  "dionysus",
  "hermes",
  "apollo",
  "artemis",
  "demeter",
  "hera",
  "poseidon",
  "ares",
]);

export function markFor(id: string): string | undefined {
  return SHIPPED.has(id) ? `/brand/${id}.png` : undefined;
}

export function hasMark(id: string): boolean {
  return SHIPPED.has(id);
}
