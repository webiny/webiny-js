# 02 — Decisions

ADR-style record of the 10 decisions that shape the container refactor. Each entry: **Context → Options → Decision → Reasoning → Consequences**.

---

## ADR-1 — Database for container mode

**Context.** Webiny's DynamoDB single-table design is deeply baked into the `*-ddb` storage-operations packages. A container-friendly database is needed.

**Options considered.**
- (a) Run **DynamoDB Local** (or `dynalite`) as a container service. Zero schema changes.
- (b) Add a new **SQL** backend (SQLite for local, PostgreSQL for production).
- (c) Hybrid — DDB Local now, SQL later.

**Decision.** **SQLite via Drizzle ORM**, with PostgreSQL as a future phase.

**Reasoning.** SQLite gives us a single in-process database — zero extra container, zero JVM, file persisted on a volume. It's a credible signal that the storage abstraction works against a non-DDB backend, which is the real architectural test. PostgreSQL is the natural next step (same Drizzle dialect with different driver) but is out of scope for this POC.

**Consequences.** Every `*-ddb` storage-operations package gets a `*-sqlite` sibling. Single-table mirror in SQL preserves storage-ops semantics 1:1. Multi-tenancy stays automatic via PK. Test divergences (eventual consistency, batch atomicity, item-size limit) are documented in `04-test-strategy.md`.

---

## ADR-2 — Container topology

**Context.** Webiny's API does HTTP/GraphQL, websockets, scheduled jobs, and async task execution. Each is a candidate for a separate container.

**Options considered.**
- (a) **Single API container** for everything.
- (b) Split api / worker / scheduler / websocket from day one.
- (c) Hybrid — api+ws in one, worker+scheduler in another.

**Decision.** **Single API container**. Split later if needed.

**Reasoning.** The POC's job is to prove the abstractions, not the production topology. One container is dramatically simpler to build, test, and demo. The abstractions for tasks (in-process runner), scheduler (node-cron), and websocket (in-memory registry) are designed so that a Redis / message-broker variant can be added later without consumer changes — splitting is an additive future change, not a redesign.

**Consequences.** No need for a message broker in the POC. Tasks run in the API event loop (acceptable for short tasks; a worker container is the natural follow-on if customers need long-running CPU-bound work).

---

## ADR-3 — Deployment target for POC

**Context.** Container-friendly platforms include docker-compose (local dev), Kubernetes (production), AWS ECS/Fargate, GCP Cloud Run, etc.

**Options considered.**
- (a) **docker-compose for local dev only.**
- (b) docker-compose + Kubernetes manifests / Helm charts.
- (c) docker-compose + ECS/Fargate (still AWS).

**Decision.** **docker-compose only** for this POC.

**Reasoning.** We're proving the container *architecture* works. Production-grade deployment (K8s, ECS, Cloud Run) is a separate effort that depends on this one. Limiting the POC to docker-compose keeps the umbrella PR reviewable and the test surface bounded.

**Consequences.** Production deployment is explicitly out of scope. We don't write Helm charts, K8s manifests, or Pulumi modules for ECS in this work. The architecture stays K8s-friendly (stateless API, externalized state on a volume) so a follow-on phase is straightforward.

---

## ADR-4 — Backwards compatibility with existing serverless

**Context.** Webiny customers run the framework on AWS today. The user's hard requirement: no breaking changes for them.

**Options considered.**
- (a) **Serverless code path completely untouched** — new abstractions are additive.
- (b) Refactor serverless to also flow through new runtime abstractions (cleaner long-term, but every Lambda/Pulumi piece becomes a regression risk).
- (c) Freeze serverless at v6.x, ship container in v7.x as a hard cut.

**Decision.** **Additive only.** Serverless code path is untouched.

**Reasoning.** Existing customers must not have to change a line of code to upgrade. New `*-sqlite` packages, the new `@webiny/handler-node` runtime, the new factory variants for leaky packages — all live alongside the existing AWS-coupled code. The user's `apps/api/graphql/src/index.ts` template stays exactly as it is.

**Consequences.** Some duplication: parallel `*-ddb` and `*-sqlite` packages. Worth it. Where DDB-coupled packages have leaky public APIs (e.g., `api-aco` exposes `DynamoDBDocument` in its types), we add new factory variants and deprecate the old ones — see ADR-9.

---

## ADR-5 — Search backend in container mode

**Context.** Serverless uses OpenSearch via `*-ddb-es` packages because DynamoDB can't do complex filtering or full-text search. SQL databases can do most of that natively.

**Options considered.**
- (a) **SQLite FTS5 only**, no OpenSearch.
- (b) Mirror the `-ddb-es` split: `*-sqlite-os` parallel package using a containerized OpenSearch.
- (c) Configurable — default FTS5, opt-in OpenSearch.

**Decision.** **SQLite FTS5 only.**

**Reasoning.** OpenSearch is a heavyweight container (Java, ~1GB RAM) that adds complexity for marginal benefit when the database itself can search. SQLite's FTS5 covers the searchable-fields use case in `api-headless-cms`. Strong consistency is a *better* property than DDB-ES's eventual consistency. PostgreSQL (future phase) gets `pg_trgm` and `tsvector` for the same role.

**Consequences.** No `*-sqlite-os` packages. Filtering and full-text logic that lives in `*-ddb-es` is re-implemented (against SQL) in `*-sqlite`. Test divergences from DDB-ES (eventual consistency settling delays become no-ops) are documented in `04-test-strategy.md`.

---

## ADR-6 — File storage in container mode

**Context.** `api-file-manager-s3` uses the AWS SDK and S3-specific features (presigned URLs, multipart uploads).

**Options considered.**
- (a) **Local filesystem driver** (new `api-file-manager-fs` package).
- (b) MinIO container (S3-compatible) so the existing S3 driver works unchanged.
- (c) Both — filesystem default, MinIO opt-in.

**Decision.** **New `api-file-manager-fs` driver**, no MinIO.

**Reasoning.** Filesystem is the simplest possible local DX — bytes go to a directory, mounted as a docker-compose volume. No extra service, no port conflicts, no S3 API surprises. The existing `FileStorageDriver` interface is the abstraction point; FS slots in cleanly. Multi-replica deployments are a future concern — the POC is single-container, so the filesystem is plenty.

**Consequences.** New package to write and test. Sharp transforms read from local FS instead of S3 (uses streams either way; no functional change). Presigned URLs are replaced with dev-time signed URLs minted by the API itself for the FS driver — a small custom signing helper.

---

## ADR-7 — SQL access layer

**Context.** Webiny doesn't currently use any ORM or query builder.

**Options considered.**
- (a) **Drizzle ORM.**
- (b) Kysely (type-safe query builder, no schema-first).
- (c) Prisma (heavyweight, full ORM, Rust query engine binary).
- (d) Raw SQL via `better-sqlite3` / `pg`.

**Decision.** **Drizzle ORM.**

**Reasoning.** Lightweight, schema-first, type-safe. Migration tooling (Drizzle Kit) is included and simple. Same dialect interface for SQLite and PostgreSQL — zero rework when we add Postgres. Less ergonomically opinionated than Prisma, more structured than Kysely.

**Consequences.** Drizzle dependency added to `@webiny/db-sqlite`. Migration files committed to the repo. Schema is declared in TypeScript (`drizzle.schema.ts`) and codegen produces SQL migrations.

---

## ADR-8 — Auth provider for local container dev

**Context.** Cognito doesn't run in docker-compose. JWT/OIDC validation is already abstracted in `@webiny/api-core/src/idp`.

**Options considered.**
- (a) **Pre-configured Keycloak container** with seeded realm.
- (b) Lightweight dev-token stub authenticator (skip a real IdP).
- (c) Both — stub default, Keycloak opt-in.

**Decision.** **Keycloak.**

**Reasoning.** A real OIDC provider exercises the full auth path that production deployments will use. It validates that any cloud's OIDC works (the abstraction does what we think it does). The seeded realm gives instant DX — `docker compose up` and login works.

**Consequences.** `keycloak` service in docker-compose with a `realm-export.json` for the dev realm. A small `IdpAdmin` abstraction is needed because the security flow currently calls Cognito user CRUD directly; the container path satisfies it via the Keycloak Admin API (or a seed script).

---

## ADR-9 — Handling DDB-coupled packages with leaky public APIs

**Context.** Several existing packages expose `DynamoDBDocument` in their public type signatures: `api-aco`, `api-audit-logs`, `api-websockets`, `api-scheduler` (and possibly others). To plug in SQLite, the public surface needs to change.

The leak in `api-aco`:
```ts
// packages/api-aco/src/createAcoStorageOperations.ts
export interface CreateAcoStorageOperationsParams {
  cms: HeadlessCms;
  security: Security;
  container: Container;
  documentClient: DynamoDBDocument;   // ← leaks AWS SDK type into the public API
}
```

**Options considered.**
- (a) **Add new factory variants alongside the old. Deprecate the old.**
- (b) Refactor the public API in place — break existing customers, document migration.
- (c) Wrap with an adapter at the extension level — build a fake `DynamoDBDocument`-shaped object that forwards to SQLite.

**Decision.** **New factory variants. Old ones marked `@deprecated`.**

**Reasoning.** Existing customer projects don't break. The new factory takes pre-built storage operations:

```ts
// New, container-friendly factory
export const createAcoWithStorageOps = (params: {
  cms: HeadlessCms;
  security: Security;
  container: Container;
  storageOperations: AcoStorageOperations;
}) => { ... };

// Old, kept working, deprecated
/** @deprecated Use createAcoWithStorageOps. */
export const createAco = (params: { documentClient: DynamoDBDocument; ... }) => {
  const storageOperations = await createAcoStorageOperations({ documentClient, ... });
  return createAcoWithStorageOps({ storageOperations, ... });
};
```

Adapter (option c) is rejected as hacky and brittle — fake document clients are a maintenance trap.

**Consequences.** Each leaky package gets a refactor PR (stage 8) that introduces the new factory and reroutes the old one through it. No behavior change for existing serverless customers. The deprecation path gives a clean removal opportunity in a future major.

---

## ADR-10 — Out of scope for this POC

**Context.** Several AWS-specific areas have no clean container equivalent and would expand the POC unreasonably.

**Decisions.** Defer the following:

| Area | Reason for deferral | Container POC behavior |
|---|---|---|
| `api-sync-system` + DDB Streams CDC | Cross-environment data sync via DDB Streams + cross-Lambda invocation. No streams in container; sync architecture needs a redesign. | Stub that no-ops in container mode. Documented as serverless-only feature. |
| `webiny watch` via AWS IoT MQTT | The hot-reload mechanism uses AWS IoT to push code into running Lambdas. | Container DX uses `tsx watch` / `nodemon`. Two parallel watch stories — not unified. |
| Admin UI hosting via CloudFront + S3 | Production-grade CDN hosting is a separate concern. | Fastify static plugin serves the Admin UI build from inside the API container. CDN is a follow-on phase. |
| Email delivery via SES | The mailer abstraction already supports SMTP. | Mailpit container in docker-compose; existing SMTP transport in `api-mailer` points at it. Zero code changes. |

See `06-out-of-scope.md` for the full deferral rationale.

**Consequences.** Each deferred area gets a one-paragraph note in the architecture doc and an item in `06-out-of-scope.md`. The POC stays bounded.
