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
- **Health**: the browser talks same-origin only, like every sibling UI. *(Superseded
  2026-08-25: the fan-out itself moved to olympus-service; this app's
  `/api/olympus/health` is now a proxy to it. See "It needs olympus-service" below.)*

---

## Stack

Next.js 15 (App Router, standalone output) · React 19 · TypeScript · Tailwind v4 ·
shadcn-style primitives with cva/clsx/tailwind-merge · Geist Sans/Mono · vitest.

Pinned to Next `15.5.24` — the patched backport line. `15.5.4` carries CVE-2025-66478.

## It needs olympus-service

The console registry and the health fan-out live in
[olympus-service](https://github.com/vezril/olympus-service). This app is the
portal: it renders what the service reports and does no probing of its own.

```
browser ──► olympus-ui BFF ──► olympus-service ──► each console's Service
         (same origin only)   (owns registry +
                               health fan-out)
```

The browser still only ever calls this app's own `/api/olympus/health`. What
changed is what sits behind that route: a proxy to the service rather than a
local fan-out. No CORS, no console exposed to the browser, unchanged.

If the service is unreachable, the portal says so with the real reason and shows
no console list — it has none to show. It does not fall back to a stale or
hardcoded list, because a portal that invents its own contents is worse than one
that admits it is blind.

## Run it locally

Start olympus-service first (it defaults to `:8080`):

```bash
cd ../olympus-service && sbt run
```

Then, with `OLYMPUS_SERVICE_URL=http://127.0.0.1:8080` in `.env.local`
(gitignored; see `.env.example`):

```bash
npm install
npm run dev
```

Off-cluster the service will report every console **Down** — it is probing
in-cluster DNS. To exercise the Live path, give the service an override registry
pointing somewhere reachable; see olympus-service's README.

The green gate, all of which CI also runs:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Configuration

| Variable | When | Default |
|---|---|---|
| `NEXT_PUBLIC_OLYMPUS_API_BASE` | **build** (Dockerfile builder ARG) | `/api/olympus` |
| `OLYMPUS_SERVICE_URL` | runtime | `http://olympus-service.olympus.svc.cluster.local` |
| `OLYMPUS_SERVICE_TIMEOUT_MS` | runtime | `4000` |

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
  console entry the service serves.
- **No favicon**, for the same reason: it should be the olympus mark.
- Auth is not here and should not be — Authelia sits at the Traefik edge and
  Olympus sits behind it like every other console.
