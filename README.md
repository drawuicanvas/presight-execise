# Presight Exercise — User Directory

A searchable, filterable directory of 1,000 users. Server-side search, filtering, sorting and
pagination over SQLite; a virtualised React client with live facet counts.

For running the production images, see **[docs/DOCKER.md](docs/DOCKER.md)**.

---

## Quick start with Docker

No Node or pnpm needed locally — just Docker. The database is baked into the image, seeded from
the committed `user_data.csv`, so there's nothing else to set up.

```bash
# first time (or after changing code) — builds the images, then starts detached
docker compose up --build -d

# subsequent times — reuses the existing images, starts detached
docker compose up -d
```

Open <http://localhost:8086> to view the app. Tear down with `docker compose down`.

`-d` runs detached so the command returns immediately instead of blocking your terminal streaming
logs; use `docker compose logs -f` to reattach to them. See [docs/DOCKER.md](docs/DOCKER.md) for
port overrides, the two image targets, and how the client talks to the API.

---

## Requirements

| Tool | Version    | Notes                                                           |
| ---- | ---------- | --------------------------------------------------------------- |
| Node | **>= 26**  | Uses the built-in `node:sqlite` and native TypeScript execution |
| pnpm | **11.8.0** | `corepack enable` picks the right version up automatically      |
| nx   | 23.x       | Task runner; `nx.json` sets `build.dependsOn: ["^build"]`       |

The server runs `.ts` files directly and has **no build step at all** — see
[Why the server never builds](#why-the-server-never-builds).

---

## Getting started

```bash
pnpm install

# creates apps/server/.env from .env.example and seeds the SQLite database
pnpm --filter=@presight/server init:dev

# the client imports @presight/schema from its dist/, so build it once up front
pnpm --filter=@presight/schema build
```

Then run the two apps in separate terminals:

```bash
pnpm --filter=@presight/server dev     # http://localhost:3000
pnpm --filter=@presight/client dev     # http://localhost:5175
```

Open <http://localhost:5175>.

The client requests the relative path `/api`, which Vite proxies to the server. Both apps are
therefore one origin as far as the browser is concerned — no CORS, and no URL to keep in sync. If
port 3000 is taken, point the proxy elsewhere:

```bash
API_PROXY_TARGET=http://localhost:3001 pnpm --filter=@presight/client dev
```

---

## Workspace layout

```
apps/
  schema/   @presight/schema  zod schemas + inferred types, shared by client and server
  server/   @presight/server  Express API over SQLite
  client/   @presight/client  React + Vite front end
```

`@presight/schema` is the contract between the other two. Both the API's responses and the
client's parsing of them come from the same zod schemas, so the wire format cannot drift from the
types without something failing loudly.

Consumers resolve it through a live symlink to `apps/schema`, so a rebuild is picked up
immediately — but `dist/` has to exist and be current. After changing anything in `apps/schema`,
rebuild it, or the other two keep compiling against the previous output:

```bash
pnpm --filter=@presight/schema build
```

nx does this for you when you build through it (`build.dependsOn: ["^build"]`).

### Why the server never builds

Node 26 strips TypeScript types natively, so `apps/server` runs its source directly —
`node src/index.ts` in development, and the same command inside the container. There is nothing to
transpile, so the package has no `build` script and `pnpm -r build` covers only schema and client.
The Docker image ships the `.ts` files via `pnpm deploy --prod`.

`apps/server/build.js` and the `esbuild` devDependency are leftovers from the removed step and can
go.

---

## Scripts

Run from the repo root.

### Everything

| Command                               | What it does                                        |
| ------------------------------------- | --------------------------------------------------- |
| `pnpm exec nx build @presight/client` | Builds schema first, then the client, via `^build`  |
| `pnpm -r build`                       | Same outcome; only schema and client have a `build` |
| `pnpm lint`                           | oxlint across the workspace                         |
| `pnpm format`                         | oxfmt, writing changes                              |
| `pnpm format:check`                   | oxfmt in check mode (use in CI)                     |

nx wants `<target> <project>` or `run <project>:<target>`. A bare `nx @presight/client:build`
fails with _"Both project and target have to be specified"_ — the first argument is read as a
target name. Note also that `pnpx` is `pnpm dlx`, which fetches a package into a temp environment;
use `pnpm exec nx` to run the workspace's own copy.

### Server — `pnpm --filter=@presight/server <script>`

| Script              | What it does                                                   |
| ------------------- | -------------------------------------------------------------- |
| `dev`               | Watch mode, reads `.env`                                       |
| `start`             | Run once, real process env only                                |
| `typecheck`         | `tsc`, no emit — the server never produces build output        |
| `init:dev`          | Create `.env` from the example, then seed the database         |
| `init:prod`         | Seed the database only (no `.env` — used by the Docker build)  |
| `data:seed`         | Rebuild `data/user_data.db` from the committed `user_data.csv` |
| `data:create-fresh` | Regenerate `user_data.csv` with new fake data, then reseed     |

`data:seed` drops and recreates the database each run; it is safe to repeat. `data:create-fresh`
generates **different** users, so hobby ids and user ids change — any URL you had bookmarked with
filters in it will no longer match.

### Client — `pnpm --filter=@presight/client <script>`

| Script      | What it does                     |
| ----------- | -------------------------------- |
| `dev`       | Vite dev server on port 5175     |
| `build`     | Typecheck, then build to `dist/` |
| `preview`   | Serve the built `dist/` locally  |
| `typecheck` | `tsc --build`, no emit           |

---

## Environment variables

### Server — `apps/server/.env`

Created by `init:dev`. Defaults live in [`apps/server/src/env.ts`](apps/server/src/env.ts).

| Variable        | Default                 | Purpose                                                      |
| --------------- | ----------------------- | ------------------------------------------------------------ |
| `NODE_ENV`      | —                       | `development` locally                                        |
| `PORT`          | `3000`                  | Port the API listens on                                      |
| `DATABASE_FILE` | `data/user_data.db`     | SQLite file, relative to the server package root             |
| `CORS_ORIGIN`   | `http://localhost:5175` | Comma-separated allowlist of browser origins; `*` allows any |

`start` reads only real process env vars — it does **not** load `.env`. That is deliberate:
production configuration should come from the environment, not a file in the image.

### Client — `apps/client/.env`

Both are optional; the defaults are what you want.

| Variable            | Default                 | Purpose                                                     |
| ------------------- | ----------------------- | ----------------------------------------------------------- |
| `API_PROXY_TARGET`  | `http://localhost:3000` | Where the **dev server** forwards `/api`. Node-side only    |
| `VITE_API_BASE_URL` | _(unset)_ → `/api`      | Set only to bypass the proxy and call another origin direct |

`API_PROXY_TARGET` is read by `vite.config.ts` in Node, so it is a normal runtime variable.
`VITE_API_BASE_URL` is different: Vite **inlines** `import.meta.env` into the bundle, so it is a
build-time value that cannot be changed on a running container. Leaving it unset is what keeps one
build runnable in every environment — see [docs/DOCKER.md](docs/DOCKER.md).

### Why CORS is usually not involved

The client calls `/api` on its own origin. A proxy forwards it — Vite in development, nginx in the
container — and strips the prefix, since the server serves its routes at the root:

```
/api/users?first_name=mo   ──proxy──►   /users?first_name=mo
```

So the browser makes no cross-origin request and `CORS_ORIGIN` never comes into play. It matters
only if you set `VITE_API_BASE_URL` to an absolute URL and call the API directly; then that origin
must appear in the server's allowlist.

> **Port 3000 is a common conflict** — Docker Desktop and other tooling like to claim it. If
> something else holds it, set the server's `PORT` and the client's `API_PROXY_TARGET` to match.
> Note that a process bound to the IPv6 wildcard and one bound to IPv4 `127.0.0.1` can hold "the
> same" port simultaneously, which looks baffling: the server appears to start fine, but requests
> reach the other program.

---

## The API

Three endpoints, all `GET`, all validated against `@presight/schema` before they are sent.

| Endpoint         | Returns                                              |
| ---------------- | ---------------------------------------------------- |
| `/hobbies`       | `[{ id, label }]` — reference list                   |
| `/nationalities` | `[{ code, label }]` — reference list                 |
| `/users`         | A page of users, pagination metadata, and two facets |

### `GET /users`

```
/users?first_name=mo&last_name=ham&nationality_code=us,sa&hobby_id=6e29c2,fa8488
      &orderby=age&sort=asc&offset=10&pagesize=40
```

| Parameter          | Notes                                                 |
| ------------------ | ----------------------------------------------------- |
| `first_name`       | Prefix match. OR-ed with `last_name`                  |
| `last_name`        | Prefix match                                          |
| `nationality_code` | Comma-separated. **Any** match (OR)                   |
| `hobby_id`         | Comma-separated. **All** must match (AND)             |
| `orderby`          | `first_name` \| `last_name` \| `age` \| `nationality` |
| `sort`             | `asc` \| `desc`                                       |
| `offset`           | Default `0`                                           |
| `pagesize`         | Default `20`, max `100`                               |

Anything invalid returns **400** with the zod issue tree rather than a 500. Blank parameters
(`?pagesize=`) are treated as absent, so a UI can serialise its whole filter state without
special-casing empties.

Sorting always appends `id` as a final tie-breaker, so ordering is total and paging cannot repeat
or skip a user. `top_hobbies` and `top_nationalities` reflect the **current** filter state, not the
whole dataset.

---

## How the client is put together

- **Server state** — TanStack Query. Reference lists are cached for 10 minutes, user results for
  1 minute. `refetchOnWindowFocus` is off: the user list is an infinite query, and a focus-triggered
  refetch re-requests _every_ loaded page.
- **Client state** — a zustand store holding only the filters. Network data never goes in it.
- **URL** — every filter is mirrored into the query string, so links are shareable and the back
  button steps through filter changes. Typing uses `replaceState` (no history spam); discrete
  actions use `pushState`.

Selector note: zustand v5 dropped the automatic shallow compare. Selectors returning a single
value are used directly; any selector building an object **must** be wrapped in `useShallow`, or it
returns a fresh reference on every store write and re-renders forever. See
[`filters-store.ts`](apps/client/src/store/filters-store.ts).

---

## Troubleshooting

**`ERR_PNPM_IGNORED_BUILDS` on install** — a dependency with an install script has no entry under
`allowBuilds` in `pnpm-workspace.yaml`. Set it to `true` or `false`. This is not cosmetic: in that
state `pnpm install` **exits 1**, which fails `RUN pnpm install --frozen-lockfile` in the Docker
build.

**Client build fails with "has no exported member"** — the schema `dist/` is stale.
Run `pnpm --filter=@presight/schema build`.

**`unplugin-dts` complains about the TypeScript compiler API** — TypeScript 7 dropped the JS
compiler API that `vite-plugin-dts` needs. `@typescript/typescript6` is installed alongside to
provide it; if it goes missing, reinstall.

**Every API request fails in the browser** — the dev proxy cannot reach the server. Confirm the
API is running, and that `API_PROXY_TARGET` points at the process actually answering on that port.
A `404` on `/api/...` usually means the client is bypassing the proxy because `VITE_API_BASE_URL`
is set in a local `.env`.
