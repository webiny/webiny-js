# Container/Self-Hosted Refactor — Change Report

## Context

Branch `sven/poc/container` adds a Docker container deployment path to Webiny alongside the existing serverless AWS path. 25 commits after `e5013115bf` introduce 11 new packages, modify ~6 existing packages, and add ~11k lines of new code. The goal: make Webiny runnable via `docker-compose` (SQLite + Keycloak + local FS) without changing the serverless code path.

---

## 1. New Packages (11)

| Package | Purpose | Key Deps |
|---------|---------|----------|
| `@webiny/db-sqlite` | Drizzle ORM wrapper, single-table schema mirroring DDB layout, FTS5 | `better-sqlite3`, `drizzle-orm` |
| `@webiny/api-core-sqlite` | SQLite storage ops for tenancy, security, admin users, KV store | `db-sqlite` |
| `@webiny/api-headless-cms-sqlite` | SQLite CMS storage (models, groups, entries), FTS5 search, full filter DSL | `db-sqlite` |
| `@webiny/api-aco-sqlite` | SQLite ACO storage (folders, FLP, tags) | `db-sqlite` |
| `@webiny/api-audit-logs-sqlite` | SQLite audit log storage | `db-sqlite` |
| `@webiny/handler-node` | Long-lived Fastify server adapter with per-request ALS isolation + DI dedupe | `fastify` |
| `@webiny/api-file-manager-fs` | Local filesystem file storage + multipart upload routes | `@fastify/multipart` |
| `@webiny/api-scheduler-cron` | In-process `setTimeout`-based scheduler (replaces EventBridge) | none |
| `@webiny/api-websockets-memory` | In-memory WS registry + Fastify WebSocket transport | `@fastify/websocket` |
| `@webiny/keycloak` | OIDC identity provider (API JWT validation + Admin UI login screen) | `keycloak-js`, `jsonwebtoken` |
| `@webiny/build-tools` (extension) | `createBuildServer` — Rspack-based server bundle pipeline | `rspack` |

---

## 2. Modifications to Existing Packages

### 2a. Pluggable Storage/Service Injection (Non-breaking)

These existing packages gained **optional** factory/service parameters that default to the legacy DDB path:

| Package | New Parameter | What It Replaces |
|---------|--------------|------------------|
| `api-aco` | `storageOperationsFactory: AcoStorageOperationsFactory` | hardcoded DDB ops |
| `api-audit-logs` | `storage?: IStorage` | `documentClient` |
| `api-scheduler` | `schedulerService?: SchedulerService.Interface` | `getClient()` |
| `api-websockets` | `registry?: IWebsocketsConnectionRegistry`, `transport?: IWebsocketsTransport` | DDB registry + API Gateway transport |

### 2b. Per-Request Identity/Authorization Scoping (`api-core`)

- `IdentityContext` — added `enterIdentityRequestScope()` using `AsyncLocalStorage` so concurrent requests don't share identity state
- `AuthorizationContext` — added `enterAuthorizationRequestScope()` for per-request permission cache isolation
- Both fall back to instance fields when no scope is active (Lambda/test compat)

### 2c. CMS GraphQL Schema Endpoint Gating (`api-headless-cms`)

- Added `isApplicable: ctx => ctx.cms.type === cmsType` to schema plugins for entries, models, groups
- **Why**: In a long-lived host, both "manage" and "read" GraphQL plugins accumulate in the shared PluginsContainer. Without gating, schema merging mixes both, creating conflicting query signatures

### 2d. OIDC Split-Host Support (`api-core`)

- Added optional `jwksUrl?: string` to `IOidcIdentityProvider` interface
- `JwksCache.getKeys()` uses direct JWKS fetch when `jwksUrl` is set (skips OpenID discovery)
- **Why**: Container deployments need browser-facing issuer URL (`localhost:8180`) decoupled from in-network JWKS endpoint (`keycloak:8080`)

### 2e. Timer API Consolidation (`handler`, `handler-aws`, `tasks`)

- Timer implementations moved to `@webiny/handler/timer` (canonical home)
- New `InfiniteTimer` for long-lived hosts (returns `Number.POSITIVE_INFINITY`)
- `handler-aws` re-exports for backward compat

---

## 3. Hacks, Workarounds & Temporary Code

### 3a. CRITICAL: DI Container Monkey-Patch

**File**: `packages/handler-node/src/dedupeContainerRegistrations.ts` (196 lines)

**Problem**: Webiny's per-request `ContextPlugin`/`createHandlerOnRequest` hooks call `container.register()` every request. In Lambda (fresh container per invocation) this is harmless. In a long-lived host, registrations accumulate linearly — after ~50 requests, `resolve` walks 50 copies of every registration and the API becomes unresponsive.

**Workaround**: Patches `Container.prototype` methods (`register`, `registerInstance`, `registerFactory`, `registerDecorator`) to:
- Skip duplicate `(abstraction, impl)` pairs (first-write-wins for singletons)
- Overwrite per-request abstractions (`Request`, `CmsContext`, `PluginsContainer`) instead of accumulating
- Return an `InertRegistrationBuilder` stub so `.inSingletonScope()` chains don't crash

**Risks**:
- Relies on `@webiny/di` internal structure (`registrations`, `instanceRegistrations`, `factories`, `decorators` Maps) via reflection
- Uses `Reflect.getMetadata("wby:abstraction", impl)` — undocumented API
- `PER_REQUEST_ABSTRACTIONS` set must be manually maintained (hardcoded strings: `"Request"`, `"CmsContext"`, `"PluginsContainer"`)
- Any upstream DI container refactor will silently break this

**Proper fix**: The DI container or the registration flow needs to natively support long-lived hosts (idempotent registration, or per-request child containers).

---

### 3b. CRITICAL: Per-Request AsyncLocalStorage Scoping

**File**: `packages/handler-node/src/perRequestContext.ts` (159 lines)

**Problem**: Webiny assumes fresh `app.webiny` context per Lambda invocation. In a long-lived host, concurrent requests trample each other's mutations on the shared context object.

**Workaround**: Replaces all per-request properties on `app.webiny` with `Object.defineProperty` getter/setters backed by `AsyncLocalStorage`. 14 hardcoded field names:
```
request, reply, security, tenancy, adminUsers, wcp, cms, aco,
auditLogs, websockets, tasks, db, debug
```

**Risks**:
- Field list is manually curated — any new per-request field added by a Webiny package that isn't in this list will cause cross-request contamination
- Uses `scope.enterWith({})` (not `scope.run()`) — enters but never explicitly exits; relies on async context propagation
- The stress test in CI catches regressions, but only for the fields it exercises

**Proper fix**: Webiny's context system should natively scope per-request state (per-request child context, or context-per-invocation pattern that works for both Lambda and long-lived).

---

### 3c. In-Memory DB Stub

**File**: `extensions/api/src/inMemoryDb.ts` (139 lines)

**Problem**: `api-headless-cms-tasks` (deleteModel CRUD), `sync-system`, etc. expect `context.db.store`. Without it, `isBeingDeleted` on CmsContentModel throws and falls back to `true`, so freshly-created models appear as "being deleted" in the Admin UI.

**Workaround**: Process-local `Map<string, unknown>` implementing the `DbDriver` interface. Single-process scope; data lost on restart.

**Risks**:
- Silent data loss if any feature actually writes meaningful data through `context.db`
- Would break in multi-container deployments (no shared state)
- Masks the real problem: these features should either use SQLite or not need `context.db`

**Proper fix**: Either port `api-headless-cms-tasks` and friends to use the SQLite storage layer, or make `context.db` optional in the CMS model system.

---

### 3d. Hardcoded Bootstrap Values

**File**: `extensions/api/src/server.ts` (lines 149-230)

- Admin email: `"admin@webiny.local"` (line 171) — hardcoded, not configurable
- Role ID: `"full-access"` (line 149) — hardcoded
- File Manager settings: `uploadMaxFileSize: 10737418240` (10GB, line 224) — hardcoded
- `srcPrefix` fallback: `"http://localhost:8080/files/"` (line 214) — hardcoded

**Proper fix**: Environment variables or a bootstrap config file.

---

### 3e. Keycloak Identity Simplification

**File**: `extensions/api/src/keycloakAuth.ts` (71 lines)

- Uses email as Webiny identity ID (not Keycloak `sub` claim)
- Hardcodes `"full-access"` role for all authenticated users
- No JIT user provisioning — only the pre-seeded admin user works

**Proper fix**: Map Keycloak `sub` to identity ID, JIT-provision on first login, map Keycloak realm roles to Webiny roles.

---

### 3f. Scheduler Has No Persistence

**File**: `packages/api-scheduler-cron/src/NodeSchedulerService.ts`

- All scheduled actions live in an in-memory `Map`
- Container restart = all pending schedules lost
- Re-arms `setTimeout` recursively for schedules beyond Node's ~24.85-day limit

**Proper fix**: Persist schedules to SQLite, reload on startup.

---

### 3g. Audit Log Storage: Missing Indexes

**File**: `packages/api-audit-logs-sqlite/src/SqliteAuditLogStorage.ts`

- DDB uses 10 GSIs for audit log queries; SQLite version does scan-and-filter within a single partition
- Acceptable for POC volumes, will degrade at scale

**Proper fix**: Add purpose-built indexes for common audit log query patterns.

---

### 3h. Type Assertion Density

Across all SQLite storage packages, heavy use of `as unknown as <Type>` when deserializing JSON from the database. Examples:
- `api-aco-sqlite/src/flp/SqliteFlpStorageOperations.ts` — 5+ casts
- `api-audit-logs-sqlite/src/SqliteAuditLogStorage.ts` — 4+ casts
- `api-headless-cms-sqlite/src/operations/entry/index.ts` — 23+ casts

**Proper fix**: Typed serialization/deserialization layer shared across all `*-sqlite` packages.

---

### 3i. File Manager Path Traversal Check

**File**: `packages/api-file-manager-fs/src/storage.ts` (line 29-30)

- Uses string prefix check: `!target.startsWith(uploadDir)` to prevent path escape
- Doesn't handle symlinks or other edge cases

**Proper fix**: Use `path.resolve()` + verify resolved path starts with `path.resolve(uploadDir)`.

---

## 4. Infrastructure & Build

| Artifact | Purpose |
|----------|---------|
| `docker-compose.yml` | 3-service stack (api + keycloak + mailpit) with volume mount |
| `extensions/api/Dockerfile` | Multi-stage Node.js build (Rspack → server.mjs) |
| `deploy/keycloak/webiny-realm.json` | Pre-seeded Keycloak realm with `admin@webiny.local` / `webiny` |
| `scripts/containerStressTest.mjs` | 1000 concurrent mixed requests — gates regressions in CI |
| `.github/workflows/` | CI wired to run container stress test |

---

## 5. Documentation

11 markdown files in `docs/container-refactor/` covering architecture, ADRs, refactor plan, test strategy, risks, out-of-scope, developer guide, concurrency isolation model, storage ops status, and production readiness.

---

## 6. Summary: What Needs a Proper Implementation

| # | Area | Severity | Current State | Proper Solution |
|---|------|----------|---------------|-----------------|
| 1 | DI container dedupe | **High** | Monkey-patches Container prototype internals | Native long-lived host support in `@webiny/di` (idempotent register, or per-request child containers) |
| 2 | Per-request context isolation | **High** | ALS-backed getter/setters with hardcoded field list | Native per-request context scoping in the Webiny context system |
| 3 | In-memory DB stub | **Medium** | Process-local Map for `context.db` | Port dependent features to SQLite or make `context.db` optional |
| 4 | Scheduler persistence | **Medium** | In-memory `Map`, lost on restart | SQLite-backed schedule store with reload-on-startup |
| 5 | Keycloak identity mapping | **Medium** | Email-as-ID, hardcoded role, no JIT provisioning | Sub-based identity, role mapping, JIT user creation |
| 6 | Bootstrap hardcoding | **Low** | Hardcoded admin email, role, FM settings | Environment variables or config file |
| 7 | Type assertion density | **Low** | 30+ `as unknown as T` casts across storage packages | Shared typed serialization layer |
| 8 | Audit log indexes | **Low** | Scan-and-filter (no GSI equivalents) | Purpose-built SQLite indexes |
| 9 | File path traversal check | **Low** | String prefix check | `path.resolve()` normalization |
| 10 | CMS schema endpoint gating | **Low** | `isApplicable` filter on schema plugins | Clean separation of endpoint-specific schema registration |
