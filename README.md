# Presight Exercise — User Directory

A searchable, filterable directory of 1,000 users. Server-side search, filtering, sorting and
pagination over SQLite; a virtualised React client with live facet counts.

For running the production images, see **[docs/DOCKER.md](docs/DOCKER.md)**.

---

## Requirements

| Tool | Version    | Notes                                                           |
| ---- | ---------- | --------------------------------------------------------------- |
| Node | **>= 26**  | Uses the built-in `node:sqlite` and native TypeScript execution |
| pnpm | **11.8.0** | `corepack enable` picks the right version up automatically      |

The server runs `.ts` files directly — there is no build step in development.

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

> **If the client loads but every request fails**, the two ports have drifted apart. The client
> calls the API directly (no dev proxy), so the server must allow the client's origin — see
> [Environment variables](#environment-variables).

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

One wrinkle worth knowing: `pnpm-workspace.yaml` sets `injectWorkspacePackages: true`, so
consumers get a **copy** of the schema package made at install time, not a live symlink. After
changing anything in `apps/schema`, rebuild it — otherwise the client and server keep compiling
against the previous version:

```bash
pnpm --filter=@presight/schema build
```

---

## Scripts

Run from the repo root.

### Everything

| Command             | What it does                                 |
| ------------------- | -------------------------------------------- |
| `pnpm -r build`     | Build all three packages in dependency order |
| `pnpm lint`         | oxlint across the workspace                  |
| `pnpm format`       | oxfmt, writing changes                       |
| `pnpm format:check` | oxfmt in check mode (use in CI)              |

### Server — `pnpm --filter=@presight/server <script>`

| Script              | What it does                                                   |
| ------------------- | -------------------------------------------------------------- |
| `dev`               | Watch mode, reads `.env`                                       |
| `start`             | Run once, real process env only                                |
| `build`             | esbuild bundle to `dist/`                                      |
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

| Variable            | Default                 | Purpose                    |
| ------------------- | ----------------------- | -------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL of the API server |

**This is a build-time value.** Vite inlines `import.meta.env` into the bundle, so changing it
requires rebuilding the client — setting it on a running container has no effect. This matters
for Docker; see [docs/DOCKER.md](docs/DOCKER.md).

### Keeping the two in sync

The client calls the API cross-origin, so two settings must agree:

- the client's `VITE_API_BASE_URL` must point at the server's `PORT`
- the server's `CORS_ORIGIN` must list the origin the client is served from

Defaults are already consistent (client on 5175, API on 3000). Change one and you must change the
other, or the browser blocks every request.

> **Port 3000 is a common conflict** — Docker Desktop and other tooling like to claim it. If
> something else holds it, set `PORT` and `VITE_API_BASE_URL` to a free port. Note that a process
> bound to the IPv6 wildcard and one bound to IPv4 `127.0.0.1` can hold "the same" port
> simultaneously, which looks baffling: the server appears to start fine, but requests reach the
> other program.

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

**`ERR_PNPM_IGNORED_BUILDS` on install** — approve or decline the build script in
`pnpm-workspace.yaml` under `allowBuilds`.

**Client build fails with "has no exported member"** — the schema `dist/` is stale.
Run `pnpm --filter=@presight/schema build`.

**`unplugin-dts` complains about the TypeScript compiler API** — TypeScript 7 dropped the JS
compiler API that `vite-plugin-dts` needs. `@typescript/typescript6` is installed alongside to
provide it; if it goes missing, reinstall.

**Every API request fails in the browser** — check the CORS pairing above, and confirm the API is
actually the process answering on that port.
