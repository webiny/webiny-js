# Session Handoff — 2026-07-27 — Storage Operations DI Split

## What was done

Two plans executed in sequence (21 commits, 86 files changed):

**Plan 1: Per-method storage operation abstractions**
- Split monolithic `StorageOperations` DI abstraction into `GroupStorageOperations`, `ModelStorageOperations`, and 22 per-method entry abstractions (e.g., `CreateEntryStorageOperation`, `ListEntriesStorageOperation`)
- Migrated 36 consumer files across 4 packages (api-headless-cms, api-aco, api-headless-cms-tasks, webhooks) to depend on specific abstractions
- Created `registerCmsStorageOperations` helper with `ICmsStorageOperationsRegistry` that enforces completeness at compile time
- Removed legacy monolithic `StorageOperations` abstraction

**Plan 2: DDB direct DI registration (no factory)**
- Converted `api-headless-cms-ddb` from factory-based to direct DI registration
- Created `DdbGroupStorageOperations` and `DdbModelStorageOperations` as proper DI implementation classes
- Created `CmsEntryStorageOpsRegistrar` abstraction for per-request entry registration (entries need request-scoped deps)
- Rewired `HeadlessCmsDdbFeature` to register directly — no `StorageOperationsFactory`, no `beforeInit`
- Added legacy factory fallback in `HeadlessCmsFeature` for non-migrated adapters (ddb-es, sql, pg-os)
- Migrated 6 test files from `cms.storageOperations` to DI abstractions
- Removed dead factory code from api-headless-cms-ddb

## Key decisions

- **Groups/models get one abstraction each** (small surface). Entry gets one abstraction per method (22 total) for maximum granularity.
- **Entry ops can't be app-scoped** — they lazily resolve `CmsStorageModelProvider` and `StorageTransformRegistry` from the container, which are request-scoped. Solution: `CmsEntryStorageOpsRegistrar` called per-request.
- **`beforeInit` eliminated** — container-per-request means singleton = request-scoped. Fresh data loaders per request without explicit clearing.
- **`storageOperations` field on HeadlessCms interface** — made optional+deprecated. Tests migrated to resolve per-method abstractions from container.
- **Legacy fallback** — `HeadlessCmsFeature` tries `CmsEntryStorageOpsRegistrar` first, falls back to `StorageOperationsFactory` for non-migrated adapters. Narrow try/catch to avoid masking errors.
- **`StorageOperationsFactory` kept with @deprecated** — ddb-es, sql, pg-os still use it.

## Current state

- Branch: `bruno/refactor/api-headless-cms-storage-ops`, 21 commits ahead of `next`
- Build: passing (api-headless-cms, api-headless-cms-ddb, api-headless-cms-ddb-es, api-aco, api-headless-cms-tasks)
- Tests: 285 passed on DDB adapter (13 previously failing tests fixed)
- Unpushed commits: 21

## What might come next

- **Migrate ddb-es adapter** — same pattern as DDB: create DI implementation classes, register `CmsEntryStorageOpsRegistrar` implementation, remove factory
- **Migrate sql and pg-os adapters** — each gets its own plan
- **Convert entry operations to per-method DI classes** — currently wrapped via `createEntriesStorageOperations` function; future step is proper DI classes per method
- **Remove `StorageOperationsFactory`** — once all adapters migrated
- **Remove `HeadlessCmsStorageOperations` interface** — once all adapters migrated and `storageOperations` field fully removed
- **Remove `storageOperations` from HeadlessCms interface** — once tests are fully migrated (currently optional+deprecated)
