# 07 — Developer Guide

Getting Webiny running locally as a container, end-to-end. Written assuming
you've just cloned the repo and have nothing else.

> **Status of the container path.** The POC is functional through stage 12.
> The full Webiny plugin set boots without a single AWS SDK call on the
> request path; the API container also serves the Admin SPA, JWT
> validation against Keycloak is wired through the OidcIdentityProvider
> abstraction, the CMS revision lifecycle (publish / unpublish /
> createRevisionFrom) is implemented, a Fastify-backed WebSocket
> transport delivers server-initiated payloads to live clients, the
> scheduler dispatches fired timers back through the standard
> preHandler chain into ExecuteScheduledActionUseCase, and concurrency
> is enforced by per-request AsyncLocalStorage scoping (see
> `08-concurrency-isolation.md`). A concurrent stress test
> (`yarn container:stress`) exercises 1000 mixed parallel requests and
> gates the design. The honest list of remaining follow-ons (watch
> mode, scheduler durability across restarts, audit-logs list at
> scale) is below under "Current limitations".

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

The api container ships with a pre-built bundle and the Admin SPA build, so
the first run is three steps:

```bash
yarn build:admin                      # builds extensions/admin/build/ (SPA)
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
# Admin UI (served from the same api container; login routes through Keycloak)
open http://localhost:8080

# API
curl http://localhost:8080/health      # → {"status":"ok"}
curl http://localhost:8080/tenants     # → {"tenants":[{"id":"root",...}]}

# Keycloak admin console (admin / admin) — also where the seeded webiny realm lives
open http://localhost:8180

# Mailpit web UI (captures everything api sends via SMTP)
open http://localhost:8025
```

Default Webiny login (seeded into the `webiny` realm):
`admin@webiny.local` / `webiny`. The user is bootstrapped with the
`full-access` role on first boot.

### File upload smoke test

The local-filesystem file driver from stage 7 is the simplest end-to-end exercise:

```bash
echo "hello container" > /tmp/sample.txt
curl -F "file=@/tmp/sample.txt;type=text/plain" \
     http://localhost:8080/files/upload
# → 204 No Content (response body is empty by S3 contract; key is taken
#    from the multipart form field, supplied by the pre-signed payload)

# Replace <key> with the value from the pre-signed payload
curl http://localhost:8080/files/<key>
# → hello container
```

For the realistic flow (pre-sign → upload → metadata write), use the Admin
UI's File Manager or the GraphQL `getPreSignedPostPayload` mutation.

Files persist in the `webiny_data` named volume at `/data/files/`.

### Concurrent stress test

Once the stack is up, exercise the cross-request isolation with:

```bash
yarn container:stress
```

The script issues 20 rounds × 5 parallel × 10 lanes = 1000 mixed concurrent
requests across `/cms/manage`, `/cms/read`, `/graphql`, file-manager, and
ACO endpoints, then asserts no `INVALID_GRAPHQL_SCHEMA*`, `Unauthenticated`,
or schema-build errors leaked across requests. This is the durability gate
for any future change that touches request scoping or shared singletons.
See `08-concurrency-isolation.md` for the architectural model the test
protects.

## Where things live

| Concern | Location |
|---|---|
| Container API entry | `extensions/api/src/server.ts` — wires every plugin and the runtime services. |
| Container Admin SPA | `extensions/admin/` — the container-mode Admin UI (mounts `@webiny/keycloak/admin`). |
| Container build | `extensions/api/Dockerfile` — `node:22-bookworm-slim`, copies the pre-built `build/server.mjs` and the Admin SPA build into `/app/admin/`. |
| Compose stack | `docker-compose.yml` (repo root). |
| Keycloak realm seed | `deploy/keycloak/webiny-realm.json`. |
| SQLite schema | `packages/db-sqlite/src/schema.ts` + `migrations/`. |
| New `*-sqlite` storage-ops packages | `packages/api-{core,headless-cms,aco,audit-logs}-sqlite/`. |
| FS file driver | `packages/api-file-manager-fs/`. |
| Container runtime adapters | `packages/handler-node/`, `packages/api-websockets-memory/`, `packages/api-scheduler-cron/`. |
| Per-request isolation | `packages/handler-node/src/perRequestContext.ts`, `packages/handler-node/src/dedupeContainerRegistrations.ts`. |
| Concurrent stress test | `scripts/containerStressTest.mjs` (`yarn container:stress`). |
| Architecture + decisions | this folder (`docs/container-refactor/`). |

## Tear down

```bash
docker compose down            # stops + removes containers, keeps the volume
docker compose down -v         # also wipes the volume (resets SQLite + uploads)
```

## Common tasks

### Iterate on the api source

```bash
# Terminal A — rebuild after each edit (no watch mode yet; see "Current limitations")
yarn build:server

# Terminal B — run the bundle directly without Docker (faster iteration than `compose up`)
mkdir -p /tmp/webiny-files
PORT=8080 SQLITE_FILE=/tmp/webiny.db FILES_DIR=/tmp/webiny-files \
  PUBLIC_BASE_URL=http://localhost:8080 \
  KEYCLOAK_ISSUER=http://localhost:8180/realms/webiny \
  KEYCLOAK_JWKS_URL=http://localhost:8180/realms/webiny/protocol/openid-connect/certs \
  KEYCLOAK_CLIENT_ID=webiny-api \
  ADMIN_BUILD_DIR=$(pwd)/extensions/admin/build \
  node extensions/api/build/server.mjs
```

A formal watch mode is on the deferred list. Until then,
`yarn build:server` + `node extensions/api/build/server.mjs` (or
`docker compose up --build api`) is the fastest dev loop.

### Iterate on the Admin SPA

```bash
yarn build:admin                       # rebuild extensions/admin/build/
docker compose restart api             # api re-serves /app/admin from the rebuilt artifact
```

The admin app sources its API URL, GraphQL endpoint, WebSocket URL, and
Keycloak settings from `REACT_APP_*` env vars baked into the build —
defaults are set in `extensions/admin/webiny.config.ts`.

### Rebuild a single workspace package after edits

```bash
yarn build -p @webiny/api-headless-cms-sqlite     # for example
```

> **Heads-up:** `yarn build:server` does NOT rebuild dependent packages —
> it bundles whatever's in their `dist/`. After editing source in a
> workspace package, the order is `yarn build -p <package>` →
> `yarn build:server` → `docker compose up -d --build api`. Skipping
> the package build silently ships a stale bundle.

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

For exercising `/graphql`, `/cms/manage`, or `/cms/read` with auth (those
endpoints accept `Authorization: Bearer <jwt>`):

```bash
curl -s -X POST \
  -d "client_id=webiny-api" \
  -d "username=admin@webiny.local" \
  -d "password=webiny" \
  -d "grant_type=password" \
  -d "scope=openid" \
  http://localhost:8180/realms/webiny/protocol/openid-connect/token \
  | jq -r .id_token
```

Use the `id_token` (not `access_token`) — Webiny's OidcIdentityProvider
matches on issuer + audience claims that Keycloak only places on the ID
token by default. The token resolves through `KeycloakIdentityProvider`
(`packages/keycloak/src/api/features/KeycloakIdp/KeycloakIdentityProvider.ts`)
which is registered into the api's identity-provider feature and maps
Keycloak claims into a Webiny `Identity` with the `full-access` role.

## Concurrency model

The container runs Webiny in a long-lived Node process serving concurrent
requests. Webiny was designed for the AWS Lambda runtime — one process per
request — so several pieces of the codebase mutate shared state under that
assumption (top-level `app.webiny` fields, DI singletons with internal
mutable state, `PluginsContainer` accumulation). The container path
addresses this architecturally rather than per-bug:

- **Per-request `app.webiny` fields** are backed by `AsyncLocalStorage`
  via `installPerRequestContextScope` in `packages/handler-node/src/perRequestContext.ts`.
  Reads/writes route through the active request's store; outside an
  HTTP request a shared fallback preserves boot-time semantics.
- **DI Container registrations are deduped** by
  `dedupeContainerRegistrations` in `packages/handler-node/src/dedupeContainerRegistrations.ts`
  so per-request `ContextPlugin`s don't accumulate. A small allowlist
  (`Request`, `CmsContext`, `PluginsContainer`) overwrites last; everything
  else is first-wins.
- **Stateful singletons** (`IdentityContext`, `AuthorizationContext`)
  hold per-request state in their own `AsyncLocalStorage` instances; the
  handler-node `onRequest` hook opens those scopes alongside the
  context scope.
- **Per-endpoint plugin pinning** — every per-endpoint GraphQL schema
  plugin (`headless-cms.graphql.schema.<endpoint>.*`, the field-type
  plugins, content-models / content-model-groups / content-entries / the
  export plugin) carries `isApplicable: ctx => ctx.cms.type === <endpoint>`
  so the long-lived `PluginsContainer` can't merge a manage variant into
  a read schema build (or vice versa).

`08-concurrency-isolation.md` is the canonical write-up. The CI job from
stage 12 runs `yarn container:stress` against a real `docker compose up`
and gates merges.

## Current limitations

These were called out at scope time in the relevant stage's commit body
and `06-out-of-scope.md`. Surfacing them here so anyone reading this guide
knows what to expect:

- **WebSocket transport at scale** — `api-websockets-memory` now ships a
  Fastify-backed transport (`FastifyWebsocketsTransport` + the
  `mountFastifyWebsockets` helper). A real `/ws` endpoint accepts
  upgrades, $connect / $default / $disconnect events dispatch through the
  full Webiny preHandler chain, and server-initiated `sendToConnections`
  delivers bytes to live sockets. Single-process only — when the
  container topology splits into api + ws + worker replicas, swap the
  in-memory registry for a Redis or NATS-backed one (the contract is the
  same `IWebsocketsConnectionRegistry`).
- **Scheduler durability** — `NodeSchedulerService` arms in-process
  `setTimeout` timers; on fire, the dispatch synthesizes a POST to a
  private `/webiny-scheduler-internal` route via `app.inject()` so the
  full Webiny preHandler chain (tenancy + per-request ALS) runs before
  `ExecuteScheduledActionUseCase` resolves the action and runs it.
  Schedules live in process memory only; if the container restarts,
  pending schedules are lost. Persisting them in SQLite + re-arming on
  boot is the durability follow-on.
- **Audit-logs list at scale** — `SqliteAuditLogStorage.list` does
  scan-and-filter for the per-app/entity/action/createdBy/date filters.
  Acceptable for POC volumes; production scale would need additional GSI
  columns + indexes added to `db-sqlite`.
- **Watch mode** — there's no `yarn build:server --watch` yet; iterate by
  re-running the build manually. `nodemon`/`tsx watch` over the bundled
  output is straightforward to add.
- **CMS Entry edge cases** — full revision lifecycle (`publish`, `unpublish`,
  `createRevisionFrom`, `getRevisions`, `getPreviousRevision`,
  `getPublishedByIds`) is implemented in `api-headless-cms-sqlite` via the
  three-row pattern (`R#<entryId>#<rev>` revisions + `L#<entryId>` /
  `P#<entryId>` pointers). Still deferred: `move` (folder move propagation
  to all revisions), `moveToBin` / `restoreFromBin`, `deleteMultipleEntries`,
  and `getUniqueFieldValues`.
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

### Admin UI loads but login redirects loop

The api validates the `iss` claim against `KEYCLOAK_ISSUER` and fetches
JWKS from `KEYCLOAK_JWKS_URL`. The browser issues tokens with
`iss=http://localhost:8180/...` (host port-forward), but the api can only
reach Keycloak via Docker DNS — so `KEYCLOAK_JWKS_URL` must point at
`http://keycloak:8080/...`. The defaults in `docker-compose.yml` already
do this; if you're running the bundle directly outside compose, mirror
both env vars. A mismatched issuer surfaces as repeated 401s right after
the OIDC redirect.

### Keycloak fails its healthcheck on Apple Silicon

The `quay.io/keycloak/keycloak:26.0` image is multi-arch. If your Docker
runtime ignores the arm64 manifest, the start sequence is slow enough to
hit the `start_period` window. Either bump `start_period` in
docker-compose.yml or switch to OrbStack (which selects arch correctly).

### `docker compose up` rebuilds the api image every time

The api `build:` block uses Docker layer caching; the only reason a
rebuild is needed is when `extensions/api/build/server.mjs` or
`extensions/admin/build/` changes. If you re-bundle (`yarn build:server`)
or rebuild the SPA (`yarn build:admin`) compose detects the change and
rebuilds that one layer in ~2 s. To skip the rebuild check explicitly:

```bash
docker compose up --no-build
```

## Where to go next

- **Architecture & decisions:** `01-architecture.md`, `02-decisions.md`.
- **Concurrency model:** `08-concurrency-isolation.md`.
- **Stage-by-stage history:** `03-refactor-plan.md`. Each completed stage
  has a corresponding commit on the umbrella branch with a detailed body.
- **Open work:** the "Current limitations" section above is the canonical
  list. Real WS transport and scheduler dispatch are the most natural
  follow-on slices.
