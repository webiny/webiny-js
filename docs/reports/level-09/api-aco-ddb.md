# @webiny/api-aco-ddb

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-aco-ddb` is the DynamoDB storage-operations implementation for `@webiny/api-aco`'s folder-level-permissions (FLP) catalog: a single `FolderLevelPermissionsStorageOperations` class (list/get/create/update/delete/batchUpdate) built on `@webiny/db-dynamodb`'s `createStandardEntity`/`createTable` and `@webiny/utils`'s `executeWithRetry`, wired into DI via `AcoDdbFeature`. The package is tiny, correct, and consistently tenant-scopes every key (`PK`/`GSI1_PK`/`GSI2_PK` all embed `T#${tenant}#...`), so there is no tenant-isolation risk here. Overall health is good; the only real gaps are the total absence of package-local tests and one still-present legacy registration path that appears to have no production caller.

## Public API
- `AcoDdbFeature` (`src/AcoDdbFeature.ts:6`) — the DI feature that lazily registers `FlpStorageOperations` (from `@webiny/api-aco`) with a real `FolderLevelPermissionsStorageOperations`. Consumed by `packages/api-event-handler-aws-ddb/src/createWebinyApiHandler.ts` and `packages/api-event-handler-aws-ddb-os/src/createWebinyApiHandler.ts` — this is the real, production wiring path.
- `registerAcoDdbStorageOperations` (`src/index.ts:10`) — legacy `createRegisterExtensionPlugin`-based registration of the same storage operations. Per codegraph, its only caller is the package's own test setup (`__tests__/__api__/setupFile.js`); no production handler invokes it.
- `FolderLevelPermissionsStorageOperations` (`src/FolderLevelPermissionsStorageOperations.ts:33`) — implements `@webiny/api-aco`'s `AcoFolderLevelPermissionsStorageOperations` interface; instantiated by both entry points above.

## Bugs
None found.

## Duplication
No clones reported by jscpd for this package (0 duplicated lines/tokens across its 3 source files). `list()`/`create()`/`update()`/`batchUpdate()` all inline the same `{ ...this.createKeys(data), ...this.createGsiKeys(data) }` key-building pattern, but this is the standard `db-dynamodb` entity idiom used identically in sibling `-ddb` storage-operations packages (e.g. `api-audit-logs-ddb`), not a local duplication problem.

## Dead code
`registerAcoDdbStorageOperations` (`src/index.ts:10`) has no production consumer — codegraph shows exactly one caller, and it's the package's own test setup file. This mirrors a common transitional pattern in the repo (legacy plugin-style registration kept alongside the newer `Feature`/DI registration), so it may be intentionally retained for backwards compatibility with hand-wired project templates rather than truly dead; confidence is medium given codegraph only traces 3 caller hops.

## Convention issues
None meaningful — one class per file, DI naming (`FolderLevelPermissionsStorageOperations` implements `AcoFolderLevelPermissionsStorageOperations`, matching the abstraction name) both follow AGENTS.md conventions.

## Test gaps
The package has no actual unit tests of its own — `__tests__/__api__/` only contains Jest setup/preset scaffolding (`setupFile.js`, `presets.js`, `setupAfterEnv.js`), no `*.test.ts` files. `FolderLevelPermissionsStorageOperations`'s key-building (tenant scoping, GSI construction) and error-wrapping paths are exercised only indirectly, if at all, via higher-level `api-aco` integration tests. Given this is the tenant-isolation-critical layer for FLP records, direct unit coverage of `createKeys`/`createGsiKeys` tenant embedding would be valuable.

## Recommendations
1. Add direct unit tests for `FolderLevelPermissionsStorageOperations` (especially `createKeys`/`createGsiKeys` tenant-scoping and the `list()` "missing required parameters" branch), since currently only Jest scaffolding exists in this package.
2. Confirm whether `registerAcoDdbStorageOperations`/`src/index.ts` is still needed by any downstream project template; if not, remove it to avoid two divergent registration paths for the same storage operations.
3. No functional changes needed otherwise — the storage layer is small, correct, and consistently tenant-scoped.
