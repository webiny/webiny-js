# 01 — Target Architecture

## Goal

Add a **second deployment path** for Webiny: one that runs inside a Docker container alongside `keycloak` and `mailpit` in `docker-compose`. The serverless deployment path stays exactly as it is today.

Both paths share the same Webiny core (Fastify handler, plugin system, context object, DI container, GraphQL layer, all business logic). They differ only at the *edges* — where the framework meets the runtime, the database, the file system, the queue, the scheduler, the websocket transport, and the auth provider.

## Two paths, one core

```
                Serverless path (unchanged)            Container path (new, additive)
                ───────────────────────────            ──────────────────────────────
                AWS infra                              docker-compose
                ─────────                              ──────────────
                  API Gateway                            api          (Node + Fastify)
                  Lambda                                 keycloak     (OIDC IdP)
                                                         mailpit      (SMTP catcher)
                Edge adapter
                ────────────
                  @webiny/handler-aws                    @webiny/handler-node     ← NEW
                  (@fastify/aws-lambda wrapper)          (app.listen + graceful shutdown)
                  
                Framework core (shared, unchanged)
                ──────────────────────────────────
                  @webiny/handler        (Fastify createHandler)
                  @webiny/api            (Context, plugins, DI)
                  @webiny/handler-graphql
                  @webiny/api-headless-cms
                  @webiny/api-file-manager (interface)
                  @webiny/api-aco / api-audit-logs / api-websockets / api-scheduler / api-mailer / ...
                  @webiny/tasks          (TaskRunner — refactored to remove ITimer leak from handler-aws)
                
                Storage operations (per-package; serverless picks DDB factories, container picks SQLite)
                ─────────────────────────────────────────────────────────────────────────────────────
                  @webiny/api-core-ddb                   @webiny/api-core-sqlite           ← NEW
                  @webiny/api-headless-cms-ddb           @webiny/api-headless-cms-sqlite   ← NEW
                  @webiny/api-headless-cms-ddb-es        (no -es; SQLite FTS5 is in -sqlite)
                  @webiny/api-aco       (DDB-coupled)    @webiny/api-aco-sqlite            ← NEW
                  @webiny/api-audit-logs (DDB-coupled)   @webiny/api-audit-logs-sqlite     ← NEW
                  @webiny/api-websockets (DDB-coupled)   in-memory connection registry     ← NEW
                  @webiny/api-scheduler (EventBridge)    @webiny/api-scheduler-cron        ← NEW
                  @webiny/api-background-tasks-ddb       @webiny/api-background-tasks-sqlite ← NEW
                  @webiny/api-file-manager-s3            @webiny/api-file-manager-fs       ← NEW
                  @webiny/api-mailer (SES default)       @webiny/api-mailer (SMTP → mailpit, config-only)

                Database / search / file storage runtime
                ────────────────────────────────────────
                  DynamoDB (single-table)                SQLite (single-table mirror) — file on a volume
                  OpenSearch                             (none — SQLite FTS5 in-process)
                  S3                                     local filesystem on a volume
                  Cognito                                Keycloak (any OIDC provider works)
                  EventBridge Scheduler                  node-cron
                  SQS / SNS / EventBridge events         in-process (single container; split later)
                  API Gateway WebSocket                  @fastify/websocket + in-memory registry
```

## What stays exactly the same

- **Fastify handler core** — `packages/handler/src/fastify.ts` returns a vanilla Fastify instance. Both `handler-aws` (`@fastify/aws-lambda` wrapper) and the new `handler-node` (`app.listen()`) consume the same factory. No changes to its API surface.
- **Plugin system, context object, DI container** — `packages/plugins`, `packages/api/src/Context.ts`, `@webiny/di`. Untouched.
- **GraphQL layer** — `@webiny/handler-graphql`. Untouched.
- **Business logic** — every package in `packages/` that doesn't end in `-ddb`, `-ddb-es`, or `-s3`. Untouched.
- **Storage-operations contract** — every `*-sqlite` package implements the *same* interface as the existing `*-ddb` package. Vitest preset reuse means contract tests run against both backends with no test rewrites.
- **JWT/OIDC validation** in `@webiny/api-core/src/idp` — already abstract over the issuer. Keycloak slots in as just another OIDC provider.
- **Authoritative API wire-up** — `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts` continues to use `createApiCoreDdb({ documentClient })`, `createAco({ documentClient })`, etc. Existing customer projects see no diff in this template.

## What is new

### Runtime adapter — `@webiny/handler-node`

A long-lived HTTP server companion to `@webiny/handler-aws`. It:

- Calls `app.listen({ port, host })` instead of wrapping with `@fastify/aws-lambda`.
- Handles `SIGTERM` / `SIGINT` for graceful shutdown — drains in-flight requests, closes the SQLite handle, flushes logs.
- Exposes a `/health` endpoint suitable for container orchestrator probes.
- Uses plain `pino` (stdout JSON) instead of `pino-lambda`.

The Fastify app it returns is byte-identical to what `handler-aws` builds; only the lifecycle around it differs.

### Database — `@webiny/db-sqlite`

A core SQLite package, analogous to `@webiny/db-dynamodb`. Built on:

- **Drizzle ORM** for schema declaration, migrations (Drizzle Kit), and type-safe queries.
- **`node:sqlite`** preferred (Node 22+, no native compile). Fallback to `better-sqlite3` if Webiny's Node baseline doesn't allow it.
- **Single-table schema** mirroring DynamoDB layout. One row per item:

  | column | meaning |
  |---|---|
  | `pk` | Partition key (matches DDB) — includes tenant where applicable |
  | `sk` | Sort key |
  | `gsi1_pk`, `gsi1_sk` | GSI1 index columns (matches DDB) |
  | `gsi_tenant_pk`, `gsi_tenant_sk` | GSI_TENANT index columns |
  | `data` | JSON column with the rest of the item body |
  | `version` | Integer for optimistic concurrency |
  | `expires_at` | Unix timestamp; rows past this are filtered out (DDB TTL parity) |

  Real indexes on `(pk, sk)`, `(gsi1_pk, gsi1_sk)`, `(gsi_tenant_pk, gsi_tenant_sk)`. Multi-tenancy is preserved automatically because tenant is part of `pk`.

- **FTS5 shadow table** for full-text search. Storage-ops update it in the same transaction as the row write. SQLite's strong consistency means there's no eventual-consistency window — a meaningful behavioral upgrade over DDB-ES.

- **Query helpers** that translate `dynamodb-toolbox` semantics:
  - `begins_with(sk, "prefix")` → `WHERE sk LIKE 'prefix%'`
  - `between(sk, "a", "z")` → `WHERE sk BETWEEN 'a' AND 'z'`
  - `LastEvaluatedKey` cursor → `(pk, sk)` tuple cursor (validated by a stage-5 spike before any storage-ops package consumes it)

The schema is intentionally a *mirror*, not a normalization. Storage-ops contract tests are written against PK/SK semantics; mirroring keeps test parity 1:1 and avoids a per-package SQL design exercise. Normalization is an option for future performance work, after parity is proven.

### Storage operations — `@webiny/api-*-sqlite`

One sibling package per existing `*-ddb` package. Each implements the same storage-operations interface, backed by `@webiny/db-sqlite`. The full list mirrors the authoritative inventory at `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts`:

| existing | new container counterpart |
|---|---|
| `api-core-ddb` | `api-core-sqlite` |
| `api-headless-cms-ddb` (and `-ddb-es`) | `api-headless-cms-sqlite` (with FTS5) |
| `api-aco` (DDB-coupled internally) | `api-aco-sqlite` (consumed via new factory variant — see decisions doc) |
| `api-audit-logs` (DDB-coupled internally) | `api-audit-logs-sqlite` |
| `api-record-locking` | `api-record-locking-sqlite` |
| `api-mailer` storage | `api-mailer-sqlite` |
| `api-headless-cms-tasks` | `api-headless-cms-tasks-sqlite` |
| `api-website-builder` | `api-website-builder-sqlite` |
| `api-workflows` | `api-workflows-sqlite` |
| `api-background-tasks-ddb` | `api-background-tasks-sqlite` |

### File storage — `@webiny/api-file-manager-fs`

Implements the existing `FileStorageDriver` interface. Bytes go to a directory mounted as a docker-compose volume. Sharp transforms read from this directory the same way they read from S3 today. File-manager metadata (which lives outside `api-file-manager-s3`) is stored on SQLite via `api-file-manager-sqlite` (new — file-manager doesn't have a `-ddb` package today, so this fills the gap).

### Long-running runtime services

- **Tasks** — `@webiny/api-background-tasks-sqlite`. In-process runner backed by a queue table in SQLite. The container has no Lambda 15-minute timeout, so resumption logic simplifies. The `ITimer` abstraction currently imported from `@webiny/handler-aws/utils` is moved into `@webiny/tasks` (or a neutral home) and given a container impl that returns `Infinity`.
- **Scheduler** — `@webiny/api-scheduler-cron`. Implements the same `SchedulerService` interface as `EventBridgeSchedulerService` using `node-cron` in-process. Same plugin registration shape; chosen at extension level.
- **WebSockets** — In-memory connection registry replaces the DDB-backed `api-websockets` registry, plus `@fastify/websocket` for the transport. When the topology splits to multiple containers later, this swaps to a Redis or NATS adapter without touching consumers.
- **Mailer** — Existing `@webiny/api-mailer` already supports SMTP. Container points it at the `mailpit` service via env config. Zero code changes.

### Auth — Keycloak (any OIDC IdP)

Container path uses Keycloak in `docker-compose` with a seeded realm and dev user. The existing JWT/OIDC validation in `@webiny/api-core/src/idp/JwtAuthenticator.ts` works unchanged — Keycloak's JWKS URL and issuer go in via env config. The Cognito user-CRUD path (which the security flow currently calls into for admin user management) is wrapped behind a small `IdpAdmin` abstraction so the container path can satisfy it via Keycloak's Admin API or seed scripts.

### Build pipeline — `createBuildServer`

A second build helper in `@webiny/build-tools`, alongside `createBuildFunction`. Bundles the API as a single Node entry point (`dist/server.js`). A multi-stage Dockerfile builds via this helper and runs on `node:lts-alpine`. Existing `createBuildFunction` and the Pulumi/Lambda packaging path are untouched.

### docker-compose stack

```yaml
services:
  api:                # Webiny container — Fastify, GraphQL, WS, in-process tasks/scheduler
  keycloak:           # OIDC IdP
  mailpit:            # SMTP catcher (UI on :8025, SMTP on :1025)

volumes:
  webiny_data:        # SQLite + uploaded files
```

No DynamoDB Local. No OpenSearch. No MinIO. The simpler the stack, the better the DX — and SQLite + FTS5 + local filesystem cover everything the single-container POC needs.

## Where the runtime split happens

There is exactly **one** place in a customer project where serverless vs container is chosen: the API entry file (`apps/api/graphql/src/index.ts` in customer projects, or `extensions/api/...` in container mode). That file decides which factories to wire up:

```ts
// Serverless (existing)
createHandler({                          // from @webiny/handler-aws
  plugins: [
    createApiCore({ storageOperations: createApiCoreDdb({ documentClient }) }),
    createAco({ documentClient }),
    // ...
  ]
});

// Container (new)
createServer({                           // from @webiny/handler-node
  plugins: [
    createApiCore({ storageOperations: createApiCoreSqlite({ db }) }),
    createAcoWithStorageOps({ storageOperations: createAcoStorageOperationsSqlite({ db }) }),
    // ...
  ]
});
```

Same plugin interface. Same context shape. Same GraphQL schema. Different runtime, different storage.

## Critical files (existing) referenced throughout this folder

| File | Why it matters |
|---|---|
| `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts` | Authoritative inventory of every plugin/factory wired into the API. The container-mode equivalent in `extensions/` mirrors this. |
| `packages/handler/src/fastify.ts` | Fastify entry. Returns a vanilla Fastify instance. Reused unchanged by both runtime adapters. |
| `packages/handler-aws/src/createHandler.ts` | Pattern that `@webiny/handler-node` follows, minus the Lambda adapter. |
| `packages/api-aco/src/createAcoStorageOperations.ts` | Confirmed leaky abstraction: takes `DynamoDBDocument` in its public type. Refactor target — see decisions doc. |
| `packages/tasks/src/runner/TaskRunner.ts` | Imports `ITimer` from `@webiny/handler-aws/utils`. Move to a neutral home; provide a container impl. |
| `packages/api-headless-cms-ddb-es/vitest.config.ts` | Existing Vitest preset-reuse pattern that `*-sqlite` packages copy verbatim. |
| `dynalite.cjs` | Current local DDB schema — useful reference for SQLite schema design. |
