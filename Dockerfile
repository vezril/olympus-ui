# syntax=docker/dockerfile:1

# ---- deps ----------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder -------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* is inlined HERE, at build time. A chart/runtime value for it is
# inert (UI-PLAYBOOK.md). Relative path => the image is environment-agnostic.
ARG NEXT_PUBLIC_OLYMPUS_API_BASE=/api/olympus
ENV NEXT_PUBLIC_OLYMPUS_API_BASE=${NEXT_PUBLIC_OLYMPUS_API_BASE}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Assert the value actually reached the browser chunks. zeus-ui shipped an image
# where it silently had not; fail the build instead of shipping that again.
# (Checks the base itself — the `${base}/health` template is concatenated at
# runtime, so the joined string never appears literally in a chunk.)
RUN set -eu; \
    if ! grep -rq -- "${NEXT_PUBLIC_OLYMPUS_API_BASE}" .next/static; then \
      echo "FATAL: API base '${NEXT_PUBLIC_OLYMPUS_API_BASE}' is not in the browser bundle" >&2; \
      exit 1; \
    fi; \
    if grep -rq -- "NEXT_PUBLIC_OLYMPUS_API_BASE" .next/static; then \
      echo "FATAL: the env var name survived into the bundle - it was never substituted" >&2; \
      exit 1; \
    fi; \
    echo "ok: API base '${NEXT_PUBLIC_OLYMPUS_API_BASE}' inlined into .next/static"

# ---- runner --------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# standalone output: server.js + a pruned node_modules. Nothing is written at runtime.
COPY --from=builder --chown=1001:1001 /app/.next/standalone ./
COPY --from=builder --chown=1001:1001 /app/.next/static ./.next/static
COPY --from=builder --chown=1001:1001 /app/public ./public

USER 1001
EXPOSE 3000

CMD ["node", "server.js"]
