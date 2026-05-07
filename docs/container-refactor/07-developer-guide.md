# 07 — Developer Guide

Getting Webiny running locally as a container, end-to-end. Written assuming
you've just cloned the repo and have nothing else.

> **Status of the container path.** This is a POC built across stages 1–10
> of the container refactor. The full plugin set boots without a single AWS
> SDK call on the request path, but a few runtime pieces are documented
> follow-ons (Admin UI hosting, real WebSocket transport, scheduler dispatch
> back into the runtime). The bits that *are* working: SQLite-backed CMS /
> ACO / audit-logs / file metadata, local-FS file uploads, Keycloak-issued
> JWT validation, in-process scheduler timers. See "Current limitations"
> below for the honest list.

## Prerequisites

| Tool | Version | How to install on macOS |
|---|---|---|
| Node | ≥ 22 LTS | `brew install node@22` |
| Yarn | classic (1.x) | shipped with Webiny via `corepack` once `yarn` is enabled |
| Docker engine | any recent | **OrbStack** (`brew install orbstack`) is fastest on Apple Silicon. Docker Desktop and Colima also work — see the `02-decisions.md` ADR list for context if you want background. |

Verify each:

```bash
node --version           # v22.x or higher
yarn --version           # 4.x or 1.22.x
docker info              # should print daemon info, not "cannot connect"
docker compose version
```

## One-time setup

```bash
git clone https://github.com/webiny/webiny-js.git
cd webiny-js
git checkout sven/poc/container       # umbrella branch — drop once merged to next
yarn install                          # ~3-5 min on first install
```

## Boot the stack

The api container ships with a pre-built bundle, so the first run is two steps:

```bash
yarn build:server                     # bundles extensions/api/src/server.ts
docker compose up                     # boots api + keycloak + mailpit
```

When the logs settle, you'll see lines like:

```
webiny-poc-keycloak  | Keycloak 26.0 on JVM (powered by Quarkus 3.15) started in 12.3s.
webiny-poc-mailpit   | [HTTP] starting on [::]:8025
webiny-poc-api       | Bootstrapped root tenant.
webiny-poc-api       | {"level":30,...,"msg":"Server listening at http://0.0.0.0:8080"}
webiny-poc-api       | Webiny container API listening on http://0.0.0.0:8080
```

`Bootstrapped root tenant.` only appears on the first boot — subsequent boots
reuse the SQLite file in the `webiny_data` named volume.

### Smoke checks

```bash
# API
curl http://localhost:8080/health      # → {"status":"ok"}
curl http://localhost:8080/tenants     # → {"tenants":[{"id":"root",...}]}

# Keycloak admin console (admin / admin) — also where the seeded webiny realm lives
open http://localhost:8180

# Mailpit web UI (captures everything api sends via SMTP)
open http://localhost:8025
```

### File upload smoke test

The local-filesystem file driver from stage 7 is the simplest end-to-end exercise:

```bash
echo "hello container" > /tmp/sample.txt
curl -F "file=@/tmp/sample.txt;type=text/plain" \
     http://localhost:8080/files/upload
# → {"key":"<uuid>.txt","name":"sample.txt","type":"text/plain","size":16}

# Replace <key> with the value from the response above
curl http://localhost:8080/files/<key>
# → hello container
```

Files persist in the `webiny_data` named volume at `/data/files/`.

## Where things live

| Concern | Location |
|---|---|
| Container API entry | `extensions/api/src/server.ts` — wires every plugin and the runtime services. |
| Container build | `extensions/api/Dockerfile` — `node:22-bookworm-slim`, copies the pre-built `build/server.mjs`. |
| Compose stack | `docker-compose.yml` (repo root). |
| Keycloak realm seed | `deploy/keycloak/webiny-realm.json`. |
| SQLite schema | `packages/db-sqlite/src/schema.ts` + `migrations/`. |
| New `*-sqlite` storage-ops packages | `packages/api-{core,headless-cms,aco,audit-logs}-sqlite/`. |
| FS file driver | `packages/api-file-manager-fs/`. |
| Container runtime adapters | `packages/handler-node/`, `packages/api-websockets-memory/`, `packages/api-scheduler-cron/`. |
| Architecture + decisions | this folder (`docs/container-refactor/`). |

## Tear down

```bash
docker compose down            # stops + removes containers, keeps the volume
docker compose down -v         # also wipes the volume (resets SQLite + uploads)
```

## Common tasks

### Iterate on the api source

```bash
# Terminal A — file watch + bundle on save (drop-in alternative to yarn build:server)
yarn build:server --watch      # not implemented yet; see "Current limitations"

# Terminal B — run the bundle directly without Docker (faster iteration than `compose up`)
mkdir -p /tmp/webiny-files
PORT=8080 SQLITE_FILE=/tmp/webiny.db FILES_DIR=/tmp/webiny-files \
  PUBLIC_BASE_URL=http://localhost:8080 \
  node extensions/api/build/server.mjs
```

A formal watch mode is on the deferred list. Until then, `yarn build:server`
+ `node extensions/api/build/server.mjs` is the fastest dev loop.

### Rebuild a single workspace package after edits

```bash
yarn build -p @webiny/api-headless-cms-sqlite     # for example
```

After adding a brand-new package, the workspace symlinks may point at the
package source instead of `dist/`; re-run `linkWorkspaces` to fix:

```bash
yarn node ./scripts/linkWorkspaces.js
```

### Run the test suites

```bash
yarn test packages/api-core                                  # default DDB variant
WEBINY_STORAGE=sqlite yarn test packages/api-core            # SQLite variant
```

Both should be at 142/144 passed (2 unrelated pre-existing skips).

### Get a Keycloak-issued access token

For exercising `/cms-manage` with auth (the GraphQL endpoint accepts the
`Authorization: Bearer <jwt>` header):

```bash
curl -s -X POST \
  -d "client_id=webiny-api" \
  -d "username=admin@webiny.local" \
  -d "password=webiny" \
  -d "grant_type=password" \
  http://localhost:8180/realms/webiny/protocol/openid-connect/token \
  | jq -r .access_token
```

(Note: the OidcIdentityProvider for the `webiny` realm hasn't been
registered into the api's identity-provider feature yet — see "Current
limitations". Tokens validate at the JWKS layer but the identity isn't
fully wired into the auth flow.)

## Current limitations

These were called out at scope time in the relevant stage's commit body
and `06-out-of-scope.md`. Surfacing them here so anyone reading this guide
knows what to expect:

- **Admin UI hosting** — the API container doesn't yet serve the Admin UI
  build. `docker compose up` exposes the GraphQL endpoints; pointing a
  browser at `http://localhost:8080` returns `{"error":"...","code":"VAR_404"}`
  rather than the Admin UI. Hosting the SPA from the same container (Fastify
  static plugin) is a small follow-on; doing it via a CDN-style separate
  container is a larger effort.
- **OidcIdentityProvider registration** — JWT signature validation against
  Keycloak's JWKS works (the abstraction in `@webiny/api-core/idp` is wired
  through env vars), but the `OidcIdentityProvider` that maps Keycloak
  claims into a Webiny `Identity` isn't registered yet. Expect auth flows
  to mostly work for unauthenticated paths; authenticated GraphQL calls
  may fail until this lands.
- **CMS revision lifecycle** — `api-headless-cms-sqlite` ships basic Entry
  CRUD; revision-aware methods (`publish`, `unpublish`, `getRevisions`,
  `createRevisionFrom`, etc.) throw `NOT_IMPLEMENTED`. Stage 6b.
- **WebSocket real transport** — `api-websockets-memory` ships an in-memory
  registry + a no-op transport. Connection bookkeeping works; bytes don't
  go anywhere. Wiring `@fastify/websocket` is a follow-on.
- **Scheduler in-process dispatch** — `NodeSchedulerService` arms timers
  correctly; when they fire, the default callback logs to stdout. Wiring
  the fired event back into the scheduled-action handler is a follow-on.
- **Audit-logs list at scale** — `SqliteAuditLogStorage.list` does
  scan-and-filter for the per-app/entity/action/createdBy/date filters.
  Acceptable for POC volumes; production scale would need additional GSI
  columns + indexes added to `db-sqlite`.
- **Watch mode** — there's no `yarn build:server --watch` yet; iterate by
  re-running the build manually. `nodemon`/`tsx watch` over the bundled
  output is straightforward to add.
- **Container size + cold start** — `yarn build:server` outputs ~3.5 MB;
  the runtime image is `node:22-bookworm-slim` plus `better-sqlite3` and
  the bundle. First boot includes SQLite migrations + root-tenant
  bootstrap (~200 ms cold). Acceptable for dev; hasn't been benchmarked
  at any production scale.

## Troubleshooting

### `Cannot find module '/.../node_modules/@webiny/<pkg>/index.js'`

The workspace symlink for that package points at the source root rather
than its built `dist/`. Re-run:

```bash
yarn build -p @webiny/<pkg>
yarn node ./scripts/linkWorkspaces.js
```

### `ENOENT: no such file or directory, mkdir '/data/files'`

Running the bundle directly without setting `FILES_DIR`. The default is
`/data/files` (a path the docker-compose container mounts a volume at).
On the host you need to point it somewhere your user can write:

```bash
FILES_DIR=/tmp/webiny-files node extensions/api/build/server.mjs
```

### Keycloak fails its healthcheck on Apple Silicon

The `quay.io/keycloak/keycloak:26.0` image is multi-arch. If your Docker
runtime ignores the arm64 manifest, the start sequence is slow enough to
hit the `start_period` window. Either bump `start_period` in
docker-compose.yml or switch to OrbStack (which selects arch correctly).

### `docker compose up` rebuilds the api image every time

The api `build:` block uses Docker layer caching; the only reason a
rebuild is needed is when `extensions/api/build/server.mjs` changes. If
you re-bundle (`yarn build:server`) compose detects the change and rebuilds
that one layer in ~2 s. To skip the rebuild check explicitly:

```bash
docker compose up --no-build
```

## Where to go next

- **Architecture & decisions:** `01-architecture.md`, `02-decisions.md`.
- **Stage-by-stage history:** `03-refactor-plan.md`. Each completed stage
  has a corresponding commit on the umbrella branch with a detailed body.
- **Open work:** the "Current limitations" section above is the canonical
  list. The bigger ones (Admin UI hosting, real WS, scheduler dispatch)
  are good first follow-on slices.
