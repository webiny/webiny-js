# 10 — Production Readiness

A living checklist of what's left between today's POC and "a customer
runs this in K8s with confidence". Two distinct distances are tracked
separately:

1. **Feature parity with DDB on a single replica** — close, ~90%, a
   couple of weeks of focused work.
2. **Production-grade for real customers** — significantly further;
   most of it is explicit POC deferral from `02-decisions.md` /
   `06-out-of-scope.md`.

Same status legend as `09-storage-ops-status.md`:

- `[ ]` — open. Not implemented or has a known gap.
- `[~]` — partial. Common case works; edges documented.
- `[x]` — done. Verified at parity for the relevant workload.

Items flip from `[ ]` → `[x]` as work lands. Where an item already has
a dedicated planning doc (e.g., `09-storage-ops-status.md`), this file
links to it rather than duplicating the detail.

---

## Part 1 — Feature parity with DDB (single replica)

**Estimate to close: 1–2 weeks of focused work.**

### CMS

- [~] **Filter DSL plugin gap.** DDB-ES has a `CmsEntryFieldFilterPathPlugin`
  system that lets field types contribute custom filter expressions.
  `api-headless-cms-sqlite/src/operations/entry/index.ts` doesn't query
  these plugins — it has the curated operator set in `SUFFIX_OPERATORS`.
  For models with custom field types that depend on a filter plugin,
  queries can silently miss matching rows. Tracked in
  `09-storage-ops-status.md`.
- [ ] **`fuzzy` and `and_in` filter operators.** Documented in
  `09-storage-ops-status.md`; no current consumer needs them but
  DDB-ES has them.
- [~] **Search semantics.** SQLite FTS5 is not OpenSearch. No
  relevance scoring, no fuzzy matching (Levenshtein), no language
  analyzers (stemming, stopwords beyond FTS5's default tokenizer),
  no faceting, no aggregations. Workloads that depend on those will
  be visibly worse. PostgreSQL phase opens up `tsvector` /
  `pg_trgm` / extensions; this gap mostly closes there.
- [ ] **CMS edge cases not E2E-tested.** Re-scheduling existing
  schedules, cancel-scheduled, scheduled unpublish, model migrations,
  deeply nested `where.AND/OR`, content models with non-trivial
  field-type combinations.

### Tasks

- [ ] **`api-background-tasks-sqlite` is missing.** Today's container
  wires `api-background-tasks-ddb` directly via `createBackgroundTasks()`
  in `extensions/api/src/server.ts`. The package is DDB-coupled —
  tasks register but I don't expect durable execution to work in
  container mode. Need a SQLite-backed equivalent that uses the
  existing tasks abstraction with a queue table + an in-process
  runner. Adjacent: `api-headless-cms-tasks` consumers (deleteModel)
  also depend on this working.

### Audit logs

- [~] **`SqliteAuditLogStorage.list` is scan-and-filter.** Loads every
  audit-log row for the tenant, then runs the per-app/entity/action/
  createdBy/date filters in memory before paginating. Tracked in
  `09-storage-ops-status.md`. Production-scale fix: extra GSI columns
  + proper indexes in `db-sqlite`, plus pushing the filter into SQL.

### Record locking

- [ ] **`api-record-locking` not E2E-tested.** Wired via
  `createRecordLocking()` but lock leasing / contention behavior
  hasn't been verified end-to-end against the running container.

### Tests

- [ ] **No SQLite-side `__tests__` for the new entry storage-ops.**
  Revision lifecycle, move, moveToBin, restoreFromBin,
  deleteMultipleEntries, getUniqueFieldValues, plus the recent
  filter-DSL additions (`between`, `not_between`) are smoke-tested
  via shell scripts only. The DDB package has unit tests; the
  preset-reuse plan from `04-test-strategy.md` was to run the same
  Vitest preset against a `sqlite` variant. Not implemented yet.

---

## Part 2 — Production-grade for real customers

**Estimate to close: 2–3 months of focused work.**

### Concurrency / multi-replica

- [ ] **WebSocket socket map is in-process.** `FastifyWebsocketsTransport`
  holds a `Map<connectionId, ws>`. Two API replicas can't fan out
  server-initiated `sendToConnections` to a client connected to the
  other replica. Production needs a Redis pub/sub or NATS-backed
  registry, plus a transport that publishes via the broker. Contract
  is the same `IWebsocketsTransport`; replacement is local to
  `api-websockets-memory`.
- [ ] **Scheduler timers are in-process.** Multiple replicas would
  each arm the same `setTimeout` and fire the schedule N times.
  Production needs leader-election or a database-backed schedule
  queue with a `claimed_by` row.
- [ ] **Schedules are not persisted.** Restart loses every pending
  schedule. SQLite-backed schedule table + re-arming on boot is the
  fix. Documented in the dev guide's "Current limitations".
- [ ] **In-memory connection registry.** Same single-replica trap as
  the WS socket map. `IWebsocketsConnectionRegistry` with a Redis or
  NATS impl is the path forward.
- [ ] **`TenantContext` is a singleton with `currentTenant` field.**
  No ALS scope on this DI singleton. Concurrent requests across
  **different** tenants race on the field. Masked today because the
  POC is single-tenant; multi-tenant production needs the same ALS
  treatment that `IdentityContext` and `AuthorizationContext` got
  in stage 12. See `08-concurrency-isolation.md`.

### Data / persistence

- [ ] **SQLite is a single file on a single volume.** No replication,
  no failover, no point-in-time recovery. PostgreSQL phase is ADR-1's
  next step and largely a driver swap (same Drizzle dialect, same
  single-table strategy). Estimated 2–4 weeks.
- [ ] **Backup story is "user's cron + `sqlite3 .backup`."** No tooling.
- [ ] **No graceful migration path.** `db-sqlite/src/migrate.ts` runs
  every migration on boot; schema drift between bundled migrations
  and a deployed DB will break boot. Need a drift detector, an
  expand/contract migration strategy, and a tested rollback path.

### Auth

- [ ] **Hard-coded `roles: ["full-access"]` for every authenticated
  user.** `extensions/api/src/keycloakAuth.ts`'s `getIdentity`
  returns full-access regardless of the JWT's actual claims. Real
  role mapping needs to read Keycloak realm/client roles and
  translate them to Webiny roles.
- [ ] **No JIT user provisioning.** Only the seeded admin
  (`admin@webiny.local`) works end-to-end; new Keycloak users
  authenticate but every authorized GraphQL operation fails to find
  a matching Webiny user record. The hook is `IdentityData.profile.external = true`;
  on first login, materialize a row in `usersStorageOperations`.
  Documented inline in `extensions/api/src/server.ts`.
- [ ] **Password reset / MFA / self-registration / invite flow.**
  Keycloak supports all of these natively; we don't proxy or
  configure them.

### Operability

- [ ] **`pino` at info level, no structured fields tuned for
  aggregation.** No correlation IDs, no per-request log enrichment.
- [ ] **No metrics, no tracing, no profile.** Add OpenTelemetry
  (or Prometheus + a /metrics endpoint) and trace exporters.
- [ ] **`/health` is shallow.** Returns 200 if Fastify is up; doesn't
  probe DB connectivity or external deps. Add `/ready` (deep probe)
  alongside.
- [ ] **No graceful-shutdown drain testing under load.** SIGTERM
  handler exists but in-flight request behavior under high
  concurrency hasn't been measured.
- [~] **`WS_NO_BUFFER_UTIL=true` workaround.** Forces `ws`'s pure-JS
  frame paths because the bundler partially picks up `bufferutil`
  natives that don't resolve at runtime. Functionally correct;
  performance impact is small. The proper fix is to externalize
  `bufferutil` + `utf-8-validate` and install them in the runtime
  image.

### Container hygiene

- [ ] **Runs as root inside the container.** No `USER` directive in
  the Dockerfile. Drop to a non-root user.
- [ ] **No read-only filesystem, no capability drops.** Standard
  K8s pod-security hardening.
- [ ] **No SBOM, no image signing, no provenance attestation.**
- [ ] **No multi-stage size optimization.** Image is `node:22-bookworm-slim`
  + bundle + `better-sqlite3`. Could be smaller with distroless.

### Deployment plumbing

- [ ] **No K8s manifests, no Helm chart, no Pulumi module.**
- [ ] **No CDN pattern for the Admin SPA.** Fastify static is the
  dev fallback (OOS-3). Production needs a separate hosting story
  — a sidecar nginx/Caddy, or guidance to put a CDN in front of
  cluster ingress.
- [ ] **No reverse-proxy / TLS termination story.** Standard pattern
  is Fastify behind an ingress controller; not documented.
- [ ] **No production secrets management.** Env vars in
  `docker-compose.yml`. Real deployments need K8s Secrets / Vault /
  AWS Secrets Manager wiring.
- [ ] **No backup/restore tooling.**

### Performance

- [ ] **Never benchmarked.** `yarn container:stress` is a correctness
  gate (catches concurrency regressions), not a load test. No baseline
  numbers for throughput, latency p50/p99, memory under sustained
  load, or behavior under SQLite write contention.
- [ ] **Known scan-and-filter hot spots.** ACO list operations and
  audit-logs list scan partitions. Both will degrade with thousands
  of entries / millions of audit events.

### POC kludges still in the code

- [~] **`extensions/api/src/inMemoryDb.ts`.** Map-backed `IStore`
  driver for `context.db`. Exists only to keep `isBeingDeleted` from
  throwing on freshly-created models — `api-headless-cms-tasks`'s
  `deleteModel` flow expects a `context.db` store but the container
  doesn't actually run that background task yet. Goes away when
  either (a) `deleteModel` runs on SQLite via a proper `IStore`
  impl, or (b) the container explicitly stubs out the task. Tracked
  in `09-storage-ops-status.md`.
- [ ] **Bootstrap re-creates root tenant + admin user on every boot.**
  `extensions/api/src/server.ts` runs idempotent `if (!exists) create`
  blocks for the root tenant, full-access role, and admin user. Fine
  for dev; production needs a one-shot init job.
- [ ] **Pre-signed file URLs are placeholders.** `api-file-manager-fs`
  doesn't actually sign upload URLs — anyone who can hit the endpoint
  can upload. For the local FS driver behind authenticated routes
  this is OK; production needs proper signing or upstream auth.

---

## Realistic roadmap

If "production-grade" means "a customer runs this in K8s with confidence":

1. **PostgreSQL backend** (ADR-1's next step). Same Drizzle dialect;
   mostly a driver swap + schema review. Solves single-file replication.
   **~2–4 weeks.**
2. **Multi-replica correctness.** ALS-scope `TenantContext`; swap
   in-memory WS registry for Redis/NATS; persist schedules to DB and
   re-arm on boot; design a real background-tasks runner. **~3–6 weeks.**
3. **Observability + security hardening.** Metrics, traces, structured
   logs, container hardening, secrets management. **~1–2 weeks.**
4. **Auth flow completeness.** JIT user provisioning, real role
   mapping, password reset, invite flow. **~1–2 weeks.**
5. **Deployment plumbing.** Helm chart, Pulumi module, CDN pattern,
   backup/restore tooling, runbook. **~2–3 weeks.**
6. **Performance + scale testing.** Real benchmarks, fix what breaks.
   **Open-ended.**

**Feature parity with today's average DDB customer workload: ~1–2 weeks.**
**Production-grade for real customers: ~2–3 months** of focused work,
much of it explicitly OOS for the POC by design.
