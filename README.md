# Olympus UI — the portal (where the gods live)

**Status:** project seed (2026-08-25). Docs placed by the Codex session on Calvin's request.
The constellation's landing page: every console as a tile (mark + name + Live/Down health
pill), one login in front (Authelia at the edge, per the access-gateway design), reachable at
`olympus.home.experimentalneutron.com` / the tailnet.

Read `UX-STANDARDS.md` first (the canonical copy lives in codex `docs/ux-standards.md` — treat
that one as authoritative if they drift), then `UI-PLAYBOOK.md` for the hard-won build/deploy
conventions every sibling UI follows.

## Olympus-specific design notes

- **Accent**: Olympus is not a god — it's the mountain the whole family lives on. Use **family
  cyan `oklch(0.85 0.2 195)` as `--primary`** (the one surface where the family identity IS the
  signature). Don't invent a new accent; the tiles carry each service's accent via its mark.
- **Mark**: no `olympus` mark exists yet in the brand set — it needs generating (the
  brand-prompts doc in dionysus-planner is the prompt catalog; suggest a motif like the
  twelve-seat mountain summit / temple pediment in cyan linework). Until then, no logo beats a
  wrong logo.
- **Tiles**: each console tile shows its god mark (codex `docs/brand/<god>.png` — keyed to the
  #06060F ground, composite them only on background), name, and a text+color health pill
  (never color-only, per §5).
- **Health**: poll server-side in the BFF (`/api/olympus/health` fan-out) — the browser talks
  same-origin only, like every sibling UI.

---

## Stack

Next.js 15 (App Router, standalone output) · React 19 · TypeScript · Tailwind v4 ·
shadcn-style primitives with cva/clsx/tailwind-merge · Geist Sans/Mono · vitest.

Pinned to Next `15.5.24` — the patched backport line. `15.5.4` carries CVE-2025-66478.

## Run it locally

```bash
npm install
npm run dev
```

Health probes target in-cluster DNS, so off-cluster every console reports **Down**
(with the reason — `timed out`, `HTTP 404`). To exercise the Live path, point a
console somewhere reachable in `.env.local` (gitignored; see `.env.example`):

```bash
OLYMPUS_HEALTH_URL_HERMES=http://127.0.0.1:3000/
```

The green gate, all of which CI also runs:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## How health works

The browser only ever calls this app's own `/api/olympus/health`. That route
fans out **server-side** to each console's in-cluster Service and returns one
report. No CORS, no console exposed to the browser, no environment-specific URL
in the bundle.

- Default probe: `GET /` on `http://<service>.<namespace>.svc.cluster.local/` —
  the same thing the k8s readiness probe uses, so 200–399 passes.
- Override per console with `OLYMPUS_HEALTH_URL_<ID>` when a console grows a
  real health endpoint. Runtime env, set from chart values.
- `planned` consoles (hera, poseidon, ares) are never probed — they are named,
  not built, and the tile says so rather than showing a permanent red pill.
- Failures are data: one dead console never fails the report. The tile shows the
  reason, and the sidebar aggregates to Live / **Degraded** / Down.

Consoles live in [`lib/registry.ts`](lib/registry.ts) — static config, mirroring
codex `apps/`. That module is the seam to replace if Olympus ever reads live from k8s.

## Configuration

| Variable | When | Default |
|---|---|---|
| `NEXT_PUBLIC_OLYMPUS_API_BASE` | **build** (Dockerfile builder ARG) | `/api/olympus` |
| `OLYMPUS_HEALTH_URL_<ID>` | runtime | in-cluster Service root |
| `OLYMPUS_HEALTH_TIMEOUT_MS` | runtime | `3000` |

`NEXT_PUBLIC_*` is inlined at build time — setting it from the chart is inert
(zeus-ui shipped that bug). The Docker build **asserts** the value reached the
browser chunks and fails if it did not.

## Image

`calvinference/olympusui` — note the Docker Hub account is `calvinference`, not
the GitHub org. Standalone Next, `node:22-alpine`, non-root uid 1001,
read-only root filesystem, listens `:3000`.

```bash
docker build -t olympusui:local .
docker run --rm -p 3000:3000 olympusui:local
```

## Chart and deploy

The chart ships in this repo at [`deploy/charts/olympus-ui`](deploy/charts/olympus-ui);
[`deploy/flux/`](deploy/flux) holds reference manifests mirroring the codex
`apps/olympus/` shape. There is **no Flux** on this cluster — deploys are a manual
`helm upgrade -f <mirrored-values>` from the tagged chart, never a bare `--set`.

`ingress.className: ""` is load-bearing: the template omits `ingressClassName`
entirely when it is empty, because an empty string is RFC-1123-invalid and k8s
rejects the whole object. CI guards both directions of that. Test through the
Traefik NodePort **:61642** — never port 80.

Releases are tags on `main` (`vX.Y.Z`). `release.yml` refuses a tag that is not an
ancestor of main, refuses a version already on Docker Hub, and skips the publish
with a warning when `DOCKERHUB_*` secrets are absent.

## Not done yet

- **The olympus mark does not exist.** The sidebar shows neutral cyan linework
  and the tiles show an accent-tinted slot — deliberately not logos. When the
  marks land, copy them to `public/brand/<god>.png` and set `mark` on the
  registry entry; drop the placeholder assertion in `tests/registry.test.ts`.
- **No favicon**, for the same reason: it should be the olympus mark.
- Auth is not here and should not be — Authelia sits at the Traefik edge and
  Olympus sits behind it like every other console.
