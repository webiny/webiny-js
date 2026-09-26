# @webiny/api-aco-sql

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-aco-sql` is the SQL (Knex/relational) counterpart to `api-aco-ddb`: a single `FolderLevelPermissionsStorageOperations` class implementing the same `AcoFolderLevelPermissionsStorageOperations` interface, lazily creating its own `webiny_aco_flp` table (`ensureTable()`) and consistently scoping every read/write by `tenant` in the `WHERE` clause. Functionally it is correct and tenant-safe, but it has a real architectural drift from its DDB sibling: it never received the newer `Feature`-based DI wiring (there is no `AcoSqlFeature`), so it still relies solely on the legacy `createRegisterExtensionPlugin` path — and, unlike the DDB package's now-unused legacy path, this one is the actual production wiring (`api-event-handler-standalone-sql/src/createWebinyApiHandler.ts`).

## Public API
- `registerAcoSqlStorageOperations` (`src/index.ts:10`) — the sole registration entry point; registers `FlpStorageOperations` (from `@webiny/api-aco`) with a real `FolderLevelPermissionsStorageOperations`. Its only production consumer is `packages/api-event-handler-standalone-sql/src/createWebinyApiHandler.ts`.
- `FolderLevelPermissionsStorageOperations` (`src/FolderLevelPermissionsStorageOperations.ts:31`) — implements `AcoFolderLevelPermissionsStorageOperations`; instantiated only by `registerAcoSqlStorageOperations`.

## Bugs
None found with high confidence. One architectural difference from `api-aco-ddb` is worth flagging at low confidence: `batchUpdate` (`src/FolderLevelPermissionsStorageOperations.ts:167-199`) issues a SQL `UPDATE ... WHERE tenant = ? AND id = ?` per item inside a transaction, which is a no-op if the row doesn't already exist, whereas the DDB version's `batchUpdate` (`api-aco-ddb/src/FolderLevelPermissionsStorageOperations.ts:181-220`) uses `entity.put()`, which upserts (creates if missing). The current caller (`UpdateFlpUseCase.executeBatchUpdate`) always supplies items whose `original: FolderLevelPermission` was already fetched, so in practice every id should already have a row and the two adapters behave the same today — but the adapters are not behaviorally equivalent, and a future caller that relies on `batchUpdate` to also create missing rows would silently lose data only on the SQL backend. Confidence: low (no confirmed reachable path where this diverges today).

## Duplication
No jscpd clones reported for this package (0 duplicated lines/tokens across its 2 source files). The class largely mirrors `api-aco-ddb`'s `FolderLevelPermissionsStorageOperations` in structure (same method set, same error-wrapping pattern), which is expected for two storage-operations implementations of the same interface, not unwanted duplication.

## Dead code
None found. Both exported symbols have live production consumers (traced above).

## Convention issues
Unlike `api-aco-ddb`, this package has no `Feature`-based DI registration class (no `AcoSqlFeature`) — only the legacy `createRegisterExtensionPlugin`-based `registerAcoSqlStorageOperations`. Since the DDB sibling package has since migrated its production wiring to a DI `Feature` and left the legacy path as an effectively unused compatibility shim, this package lagging behind is a real (if low-impact) inconsistency between the two storage adapters that higher-level docs/AGENTS.md conventions point toward closing.

## Test gaps
Same as `api-aco-ddb`: `__tests__/__api__/` only contains Jest setup/preset scaffolding, no `*.test.ts` files directly in this package. `ensureTable()`'s lazy-create-on-first-use behavior and the tenant-scoped `WHERE` clauses are not covered by package-local unit tests.

## Recommendations
1. Add an `AcoSqlFeature` DI feature (mirroring `api-aco-ddb`'s `AcoDdbFeature`) so both storage adapters are wired consistently, and evaluate whether `registerAcoSqlStorageOperations` can then be deprecated the same way the DDB legacy path effectively was.
2. Add direct unit tests for `FolderLevelPermissionsStorageOperations`, particularly tenant-scoping on `list`/`get`/`update`/`delete` and the `ensureTable` first-call table-creation path.
3. If `batchUpdate` is ever extended to cover items that may not yet have a row, switch the SQL implementation to an upsert (`insert(...).onConflict(...).merge()`) to match the DDB adapter's create-or-update semantics.
