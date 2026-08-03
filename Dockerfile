# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:26-slim
ARG PNPM_VERSION=11.8.0

# ---------------------------------------------------------------------------
# base: pin pnpm via corepack so builds are reproducible (no floating version)
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS base
ARG PNPM_VERSION
WORKDIR /app
# corepack ships separately from Node 25+, install it explicitly before using it.
RUN npm install -g corepack && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate



# ---------------------------------------------------------------------------
# app-build: build schema, client and server, then produce a self-contained
# prod-only deploy of the server (dist + prod node_modules, no monorepo needed)
# ---------------------------------------------------------------------------

FROM base AS app-build

# Vite inlines import.meta.env at build time, so the client's API base URL is frozen into the
# JS bundle here. It CANNOT be changed later with an env var on the running container — pointing
# the client somewhere else means rebuilding with a different value.
# This URL is resolved by the browser, so it must be reachable from the host, not from inside
# the compose network (http://localhost:3030, never http://server:3030).
ARG VITE_API_BASE_URL=http://localhost:3030
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter=@presight/schema build

# @presight/schema is an "injected" workspace dependency (pnpm-workspace.yaml
# sets injectWorkspacePackages: true), meaning consumers get a hard copy of it
# made at install time, not a live symlink. Re-run install so the client and
# server pick up the schema dist/ that was just built above.

RUN pnpm install --frozen-lockfile --offline

RUN pnpm --filter=@presight/client build
RUN pnpm --filter=@presight/server --prod deploy /presight-exercise-server

# The sqlite database is never copied from the host, it is built here from the
# committed user_data.csv so the image always carries a known-good dataset.
RUN cd /presight-exercise-server && pnpm run init:prod

# ---------------------------------------------------------------------------
# client: static assets served by nginx
# ---------------------------------------------------------------------------

FROM nginx:alpine AS pseclient

COPY --from=app-build /app/apps/client/dist /usr/share/nginx/html
RUN sed -i 's/listen\s\+80;/listen 8086;/' /etc/nginx/conf.d/default.conf

EXPOSE 8086

CMD ["nginx", "-g", "daemon off;"]

# ---------------------------------------------------------------------------
# server: run the esbuild-bundled output with its deployed prod node_modules
# ---------------------------------------------------------------------------

FROM ${NODE_IMAGE} AS pseserver

WORKDIR /app
COPY --from=app-build /presight-exercise-server ./

ENV NODE_ENV=production
ENV PORT=3030

EXPOSE 3030

CMD ["node", "src/index.ts"]
