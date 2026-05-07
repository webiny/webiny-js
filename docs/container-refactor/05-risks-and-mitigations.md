# 05 — Risks and Mitigations

Risks identified during the planning phase. Each one is something that could quietly derail the refactor — surface it now, mitigate it explicitly, and document it for the reviewer.

---

## R1 — DynamoDB Streams CDC is silently load-bearing

**The risk.** Two existing systems rely on DDB streams as a change-data-capture mechanism:

1. `api-dynamodb-to-elasticsearch` — tails streams to keep OpenSearch indexes in sync with DDB.
2. `api-sync-system` — moves data between Webiny environments by tailing streams and invoking destination Lambdas.

In container mode there are no streams. Anyone assuming "we just swap the storage backend" is missing this.

**Mitigation.**
- Container mode does not need (1) — search lives in the database via SQLite FTS5, updated in the same transaction as the row write. No CDC pipeline.
- Container mode treats (2) as out of scope (see `06-out-of-scope.md`). The `api-sync-system` package is wired with a no-op stub in container mode.
- Both behaviors are documented in the architecture doc and called out in the relevant stage PR descriptions.

**Where it bites if missed.** Stage 6 storage-ops tests for `api-headless-cms-sqlite` could pass while real sync flows in customer projects silently break. The mitigation closes the gap because the sync system is explicitly stubbed.

---

## R2 — Public APIs that leak `DynamoDBDocument`

**The risk.** Several existing packages put `DynamoDBDocument` in their public type signatures: `api-aco`, `api-audit-logs`, `api-websockets`, `api-scheduler` (and possibly more — surface during stages 5–7). To plug SQLite in, these public APIs need to change. Naively that's a breaking change for serverless customers.

**Mitigation.** New factory variants alongside the old, deprecate the old. See ADR-9 in `02-decisions.md`.

```ts
// New, container-friendly
export const createAcoWithStorageOps = (params: { storageOperations: AcoStorageOperations; ... }) => { ... };

/** @deprecated Use createAcoWithStorageOps. */
export const createAco = (params: { documentClient: DynamoDBDocument; ... }) => {
  const storageOperations = await createAcoStorageOperations({ documentClient, ... });
  return createAcoWithStorageOps({ storageOperations, ... });
};
```

Existing customers don't update a line. New container-mode entry files use the new factories.

**Where it bites if missed.** Forgetting a leaky package until stage 9 means re-opening stage 8 retroactively. Mitigation: stage 5–7 reviewers explicitly look for new leaks as they touch each consumer.

---

## R3 — `tasks` package leaks Lambda `ITimer`

**The risk.** `packages/tasks/src/runner/TaskRunner.ts` imports `ITimer` from `@webiny/handler-aws/utils`. The runner asks the timer "are we close to the Lambda timeout?" to decide whether to checkpoint and re-schedule. Container mode has no timeout — but the runner branches on `isCloseToTimeout`, so a hardcoded `false` would technically work yet leaves the abstraction broken.

**Mitigation.** Stage 2 moves `ITimer` out of `@webiny/handler-aws/utils` to a neutral home (likely `@webiny/tasks` itself). Two implementations:
- `LambdaTimer` (existing, in `@webiny/handler-aws`).
- `InfiniteTimer` (new, in `@webiny/tasks`) — `getRemainingMilliseconds()` returns `Infinity`.

The runner consumes the abstraction; the runtime adapter picks the implementation.

**Where it bites if missed.** Container mode would import from `@webiny/handler-aws` just to get a type — coupling that contradicts the whole point of the refactor.

---

## R4 — `pino-lambda` is hard-coded in `handler-aws`

**The risk.** `packages/handler-aws/src/createHandler.ts` configures `pino-lambda` for log shipping. Container mode wants plain `pino` writing JSON to stdout (let the orchestrator collect logs).

**Mitigation.** `@webiny/handler-node` provides its own logger setup — plain `pino`, stdout transport. The Fastify core (`@webiny/handler`) doesn't pin the logger; both adapters install their own. Zero shared change.

**Where it bites if missed.** Container logs would be Lambda-formatted nonsense. Caught immediately on first stage-2 boot.

---

## R5 — Cognito user CRUD is wired into security flow

**The risk.** Even though JWT/OIDC validation is abstract, the security flow currently calls Cognito-specific user-CRUD methods (create user, set password, etc.) — see `packages/cognito`. Replacing the IdP with Keycloak doesn't automatically replace these calls.

**Mitigation.** Stage 10 introduces a small `IdpAdmin` abstraction. Cognito implementation stays in serverless; container path provides a Keycloak Admin API implementation (or relies on seed scripts for the POC and Admin API for real use).

**Where it bites if missed.** Admin user creation in container mode breaks at runtime. Stage 5 will surface this for tenant/admin bootstrap; stage 10 fully resolves it.

---

## R6 — Conditional writes / optimistic concurrency

**The risk.** `dynamodb-toolbox` may emit `ConditionExpression` clauses on writes. If SQLite doesn't enforce equivalent semantics, two concurrent writers could clobber each other in container mode but not in serverless — a subtle data-loss bug.

**Mitigation.** SQLite implementation uses:
- `UNIQUE` constraints on `(pk, sk)` so duplicate inserts fail.
- A `version` integer column incremented on every update; updates use `WHERE version = ?` so stale writes fail.
- Storage-ops contract tests include a concurrent-update scenario that asserts both backends behave identically.

The cursor-parity spike in stage 4 also exercises this path.

**Where it bites if missed.** Production data loss under concurrent admin edits. Mitigation is "tests that exercise the conflict path"; if those are missing, the bug is invisible.

---

## R7 — DDB 400 KB item-size limit

**The risk.** DDB rejects items over 400 KB. SQLite has no such limit. Tests that happen to use oversized items would pass on SQLite and fail on DDB.

**Mitigation.** Document divergence in `04-test-strategy.md`. Don't gate tests on it — the failure mode is graceful (DDB rejects, SQLite accepts; data on DDB is bounded, on SQLite is not). If a real SQLite-only feature ends up storing huge items, surface it at code review.

**Where it bites if missed.** A test passes locally on SQLite, breaks in serverless CI. Caught fast because we run all three variants.

---

## R8 — `better-sqlite3` is a native dep

**The risk.** `better-sqlite3` requires per-platform compilation. CI and developer machines may build differently; Lambda runtime (if it ever needs SQLite for any reason) would build for Linux x86_64; macOS dev machines build for darwin-arm64. Painful.

**Mitigation.** Prefer **`node:sqlite`** (Node 22+, no native compile, ships with Node) if Webiny's Node baseline supports it. Falls back to `better-sqlite3` only if the baseline is older. Decision recorded in stage 4 PR.

**Where it bites if missed.** Container builds break on different host platforms. Mitigation: choose `node:sqlite` if possible, document the baseline if not.

---

## R9 — Test divergences DDB ↔ SQLite

**The risk.** Even with shared contract tests, behavior differs in real ways: eventual consistency vanishes, batch failures are all-or-nothing, result ordering is implementation-defined unless explicit, item-size limit is gone. Tests pass on one backend and fail on the other.

**Mitigation.** Each divergence is enumerated and addressed in `04-test-strategy.md`:
- Eventual consistency → no-op delays.
- Batch failures → variant-conditional assertions.
- Result ordering → explicit `ORDER BY` in every SQLite query.
- Item-size limit → documented, not gated.

**Where it bites if missed.** Flaky CI; reviewers waste time chasing phantom failures. Mitigation is "document the divergences upfront and write conditional assertions where they're real."

---

## R10 — `webiny watch` uses AWS IoT MQTT

**The risk.** Webiny's hot-reload mechanism uses AWS IoT to push code into running Lambdas. Container DX needs a different mechanism. Two parallel watch stories means more code to maintain.

**Mitigation.** Container DX uses `tsx watch` / `nodemon`. Documented as a separate dev-mode story; not unified with the IoT-based one. (See `06-out-of-scope.md`.)

**Where it bites if missed.** Stage 11 DX feels jankier than the serverless path. Mitigation: bake `tsx watch` into the dev compose service so file changes restart the API container automatically.

---

## R11 — Admin UI hosting in container mode

**The risk.** Admin UI today is served by CloudFront from S3. Container mode needs a different static hosting story. Wrong choice could mean a separate nginx container, more complexity than the POC justifies.

**Mitigation.** Fastify static plugin serves the Admin UI build output from inside the API container. Single container, no extra service. Production-grade CDN hosting is a follow-on phase. (See `06-out-of-scope.md`.)

**Where it bites if missed.** Stage 7 reviewers ask "where does Admin UI live?" and we don't have an answer. Mitigation: this doc, the architecture doc, and stage-7 PR description all say "Fastify static, follow-on phase for CDN."

---

## Cross-cutting: regression risk to serverless

The "additive only" promise is easy to break by accident. Three classes of risk:

1. **Shared interface changes.** Adding a method to `FileStorageDriver` for the FS driver requires `S3Driver` to implement it too — silently broken if missed.
2. **Lockfile drift.** New deps (Drizzle, `node:sqlite` polyfills if any, `@fastify/websocket`) at the root may cascade into platform-specific install issues for the serverless build.
3. **Optional fields.** New optional fields on shared types may go unset by serverless code paths; if container code assumes them present, behavior diverges.

**Mitigation.**
- Run the full DDB and DDB-ES test variants in CI for every stage PR — they catch shared interface regressions.
- Run `yarn webiny sync-dependencies` after every dep change (per `CLAUDE.md` pre-commit checklist) to catch drift.
- Default values for any new optional fields documented at the type level.
