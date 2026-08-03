# Docker deployment

Everything builds from the single root [`Dockerfile`](../Dockerfile). It is multi-stage with two
publishable targets:

| Target      | Base           | Contains                                     | Listens on | Size   |
| ----------- | -------------- | -------------------------------------------- | ---------- | ------ |
| `pseserver` | `node:26-slim` | Express API + SQLite database                | `3030`     | ~277MB |
| `pseclient` | `nginx:alpine` | The client's static `dist/`, served by nginx | `8086`     | ~65MB  |

The shared `app-build` stage compiles all three workspace packages once, then
`pnpm --filter=@presight/server --prod deploy` produces a self-contained server tree with only
production dependencies — no monorepo, no pnpm at runtime.

**The database is baked into the image.** The build seeds `data/user_data.db` from the committed
`user_data.csv` via `init:prod`, so the server image ships with a known-good 1,000-user dataset and
needs no volume, no init container, and no external database.

---

## Quick start

```bash
docker compose up --build
```

- Client → <http://localhost:8086>
- API → <http://localhost:3030>

Tear down with `docker compose down`.

If either port is taken, override both — they are wired into `CORS_ORIGIN` and
`VITE_API_BASE_URL` too, so the pairing stays correct:

```bash
WEB_PORT=8090 API_PORT=3031 docker compose up --build
```

> Changing `API_PORT` **requires a rebuild**, not just a restart. See
> [build-time vs runtime](#build-time-vs-runtime) below.

---

## Environment variables

### Build-time vs runtime

This is the one thing that catches people out.

**The client has no runtime configuration at all.** Vite inlines `import.meta.env` into the
JavaScript bundle when it compiles, so `VITE_API_BASE_URL` is frozen into the built assets. Setting
it on the running container does nothing — nginx is just serving static files that already contain
the URL. Pointing the client at a different API means **rebuilding the image**.

The server is the opposite: every one of its variables is read at startup from the real process
environment, so it is configured normally with `-e` / `environment:`.

### Client — build arguments

Passed with `--build-arg`, or `build.args` in compose.

| Argument            | Default                 | Purpose                                        |
| ------------------- | ----------------------- | ---------------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:3030` | Base URL of the API, no trailing slash         |
| `NODE_IMAGE`        | `node:26-slim`          | Build/runtime base image                       |
| `PNPM_VERSION`      | `11.8.0`                | Pinned via corepack so builds are reproducible |

`VITE_API_BASE_URL` is resolved **by the browser**, not by the container. It must therefore be an
address the user's machine can reach — the published host port or a public hostname. A compose
service name such as `http://server:3030` resolves only inside the Docker network and will fail
for every real visitor.

### Server — runtime environment

| Variable        | Default in image        | Purpose                                                       |
| --------------- | ----------------------- | ------------------------------------------------------------- |
| `NODE_ENV`      | `production`            | Set by the Dockerfile                                         |
| `PORT`          | `3030`                  | Port the API listens on inside the container                  |
| `DATABASE_FILE` | `data/user_data.db`     | SQLite file, relative to the app root. Baked in at build time |
| `CORS_ORIGIN`   | `http://localhost:5175` | Comma-separated allowlist of browser origins; `*` allows any  |

**`CORS_ORIGIN` must be set for any real deployment.** Its default targets the local Vite dev
server, so a containerised client on port 8086 is _not_ allowed and every request the browser makes
will be blocked. Set it to the origin the client is served from.

### A working pair

For the two services to talk, two settings must agree:

```
client build arg   VITE_API_BASE_URL = http://localhost:3030   ─┐ must point at
server runtime env PORT              = 3030                    ─┘ the published API port

client is served from  http://localhost:8086                   ─┐ must be listed
server runtime env CORS_ORIGIN = http://localhost:8086          ─┘ in the allowlist
```

`docker-compose.yml` derives all four from `WEB_PORT` and `API_PORT` so they cannot drift.

---

## Building and running without compose

```bash
# Server
docker build --target pseserver -t presight-server .
docker run --rm -p 3030:3030 \
  -e CORS_ORIGIN=http://localhost:8086 \
  presight-server

# Client — the API URL must be supplied at BUILD time
docker build --target pseclient -t presight-client \
  --build-arg VITE_API_BASE_URL=http://localhost:3030 .
docker run --rm -p 8086:8086 presight-client
```

### Deploying to a real host

Substitute real origins on both sides:

```bash
docker build --target pseclient -t presight-client \
  --build-arg VITE_API_BASE_URL=https://api.example.com .

docker run -d -p 3030:3030 \
  -e CORS_ORIGIN=https://app.example.com \
  presight-server
```

---

## Verifying locally

With the stack up, these are the checks worth running. Substitute your ports.

```bash
# 1. containers are up and healthy
docker compose ps

# 2. the API answers
curl -i http://localhost:3030/hobbies          # 200, 30 items
curl -i http://localhost:3030/nationalities    # 200, 51 items
curl -s "http://localhost:3030/users?pagesize=1" | head -c 300

# 3. the database really is inside the image
docker compose exec server ls -la data/
#   -> user_data.db, ~880 KB

# 4. CORS allows the client's origin and nothing else
curl -sD- -o /dev/null -H "Origin: http://localhost:8086" http://localhost:3030/hobbies \
  | grep -i access-control-allow-origin
#   -> Access-Control-Allow-Origin: http://localhost:8086

curl -sD- -o /dev/null -H "Origin: http://evil.example" http://localhost:3030/hobbies \
  | grep -i access-control-allow-origin
#   -> no output; the browser would block this origin

# 5. nginx serves the client
curl -o /dev/null -w '%{http_code}\n' http://localhost:8086/

# 6. the bundle really was built against the API URL you passed
docker compose exec client sh -c \
  "grep -ohE 'http://localhost:[0-9]+' /usr/share/nginx/html/assets/*.js | sort -u"
#   -> must match VITE_API_BASE_URL. If it shows a different port, the image
#      was built with the wrong build-arg — restarting will not fix it.
```

Then open the client in a browser and confirm the user list loads, filters apply, and the URL
updates as you filter. If the page renders but the list shows an error, it is almost always
step 4 or step 6.

```bash
docker compose logs -f server
```

---

## Troubleshooting

**`Bind for 0.0.0.0:3030 failed: port is already allocated`**
Something else — often another container — holds the port. Find it with
`docker ps --format 'table {{.Names}}\t{{.Ports}}'`, then either stop it or use
`WEB_PORT`/`API_PORT`. Port `3000` in particular is frequently claimed by Docker Desktop and other
tooling.

**The page loads but every request fails**
CORS. The server's `CORS_ORIGIN` does not list the origin serving the client. Check the browser
console for a CORS error and compare against verification step 4.

**Requests go to the wrong port**
The client image was built with the wrong `VITE_API_BASE_URL`. It is compiled in — rebuild with
the correct `--build-arg`. Verification step 6 confirms which URL is actually in the bundle.

**Client shows a blank page**
Check `docker compose logs client`. If nginx is fine, the `app-build` stage probably produced an
empty `dist/`; rebuild with `--progress=plain --no-cache` and read the client build step.

**Schema changes are not reflected**
`pnpm-workspace.yaml` sets `injectWorkspacePackages: true`, so consumers receive a copy of
`@presight/schema` made at install time. The Dockerfile handles this by installing, building the
schema, then installing again — do not remove that second `pnpm install`.

---

## Notes on the image design

- **No volumes.** The dataset is immutable and baked in. To ship different data, regenerate
  `user_data.csv` with `pnpm --filter=@presight/server data:create-fresh`, commit it, and rebuild.
- **The server runs TypeScript directly** (`node src/index.ts`) — Node 26 strips types natively, so
  there is no transpile step in the final stage.
- **pnpm is pinned** through corepack rather than floating, so a build today and a build in six
  months resolve the same package manager.
- **`.dockerignore` excludes `apps/server/data/`**, so a local development database is never
  copied into the image — it is always rebuilt from the CSV.
