# 04 — Test Strategy

The user's hard requirement: high confidence the tests are passing **and testing the correct things**. This document explains how that's achieved without rewriting the existing test corpus.

## Principle: reuse contract tests, swap backends

Webiny already has a Vitest preset pattern that lets the same test suite run against multiple storage backends. The DDB and DDB-ES variants of `api-headless-cms` use it today:

```ts
// packages/api-headless-cms-ddb-es/vitest.config.ts
import { getPresets } from "@webiny/testing/vitest.preset.js";

export default {
  test: {
    setupFiles: getPresets(["@webiny/api-headless-cms", "storage-operations"]),
    // ...
  }
};
```

Both `*-ddb` and `*-ddb-es` packages reuse the *same* contract tests — a shared suite that exercises the storage-ops interface — and just point at a different backend setup. We do exactly the same for `*-sqlite`.

## Three test variants going forward

| Variant | Backend | What it proves |
|---|---|---|
| `ddb` | DynamoDB Local (dynalite) | Existing serverless behavior unchanged |
| `ddb-os` | DynamoDB + OpenSearch | DDB-with-search behavior unchanged |
| `sqlite` *(new)* | SQLite + FTS5 | New container behavior matches the contract |

CI runs all three for every storage-ops package that has a `-sqlite` sibling. A regression in any of the three blocks merge.

Per-package commands (preferred during development):
```bash
yarn test:ddb api-headless-cms       # existing
yarn test:ddb-os api-headless-cms    # existing
yarn test:sqlite api-headless-cms    # new
```

The `tester` skill (`yarn test ...`) handles all three variants; the variant flag selects backend-specific setup.

## Expected behavioral divergences (documented in tests)

Some tests will need backend-specific assertions because DDB and SQLite genuinely behave differently. We document each divergence at the test site rather than letting it be a silent skipped test.

### 1. Eventual consistency vanishes

DDB-ES tests today insert artificial settling delays after writes (`await wait(500)`) before asserting search results. SQLite is strongly consistent — these waits become no-ops, but the tests still pass because the assertion is the same. **Action:** no change needed; document the divergence in a `KNOWN_DIVERGENCES.md` next to the test files. Optional follow-up: shrink the delays to zero in the `sqlite` variant for faster runs.

### 2. Batch failure semantics

DynamoDB batch writes can partially succeed (some items written, others not). SQLite transactions are all-or-nothing. Tests that assert partial-success behavior will fail on SQLite. **Action:** identify them during stage 5–6 review; rewrite them as variant-conditional assertions:

```ts
test("batch write failures", () => {
  const result = await batchWrite([...]);
  if (variant === "sqlite") {
    expect(result.failed).toBe(true);
    expect(result.writtenCount).toBe(0);  // all-or-nothing
  } else {
    expect(result.failed).toBe(true);
    expect(result.writtenCount).toBeGreaterThan(0);  // partial OK
  }
});
```

### 3. Result ordering

DDB returns items in PK/SK order (effectively, the index dictates it). SQLite returns rows in implementation-defined order unless `ORDER BY` is explicit. **Action:** every storage-ops query in the SQLite implementation includes an explicit `ORDER BY (pk, sk)` (or equivalent for GSI queries). Make this a code-review checkpoint.

### 4. Item-size limit

DDB enforces a 400 KB item-size limit; SQLite does not. Test fixtures that happen to use oversized items pass on SQLite and fail on DDB. **Action:** note in tests that use such fixtures. Don't gate on this — the failure mode is "DDB rejects, SQLite accepts," which is graceful.

### 5. Conditional writes / optimistic concurrency

`dynamodb-toolbox` may emit `ConditionExpression` clauses for upserts. SQLite implements the equivalent semantics via `UNIQUE` constraints + a `version` column + `WHERE version = ?` predicates. **Action:** validate the upsert path in the cursor-parity spike (stage 4) and assert both backends behave identically for concurrent-update conflicts.

### 6. Pagination cursors

DDB returns a `LastEvaluatedKey` (a JSON object containing the indexed attributes). SQLite needs a `(pk, sk)` tuple cursor for equivalent paging behavior. **Action:** the cursor encoding lives in `@webiny/db-sqlite` query helpers, with a unit test that asserts a 100-item dataset paginates identically across DDB and SQLite given the same page size.

## End-to-end smoke (stage 12)

A short E2E suite runs against the live `docker-compose` stack in CI:

| # | Operation | Asserts |
|---|---|---|
| 1 | Boot stack: `docker compose up -d` | All services healthy within 60 s |
| 2 | Login via Keycloak-issued JWT | Auth succeeds; `currentTenant` resolves |
| 3 | Create content model | `cms-manage` mutation returns the model |
| 4 | Create entry | Entry persists; `cms-read` returns it |
| 5 | Search entries | FTS5 returns expected match |
| 6 | Upload file | File persists on the volume; metadata in SQLite |
| 7 | Render thumbnail | Sharp transforms work against local FS |
| 8 | Schedule a one-shot job | Cron fires within the expected window |
| 9 | Tear down: `docker compose down` | No orphaned volumes; cleanup is idempotent |

This is small on purpose. The goal is signal that the stack works end-to-end, not duplicate the unit/integration coverage that already exists.

## Sanity check: the smoke suite must catch a real regression

Before declaring stage 12 done, deliberately introduce a bug (e.g., break tenant filtering in `api-core-sqlite`) and confirm the smoke suite turns red. If it doesn't, the suite isn't testing what we think it's testing.

## What this strategy does NOT do

- **No new test framework, no new assertion patterns.** Vitest stays. Existing presets stay.
- **No per-storage-ops bespoke E2E.** The contract test suite is shared. Per-backend specifics are limited to setup files and conditional assertions where divergences are real.
- **No load testing in this POC.** The container path's performance characteristics (SQLite write throughput under concurrency, FTS5 query latency at scale) are out of scope. Add as a follow-on phase if/when a customer needs them.
