# Session Handoff — 2026-07-27 — Storage Ops Per-Method DI

## What was done

Completed the full DI migration of CMS storage operations across all 4 adapters (DDB, DDB-ES, SQL, PG-OS). 43 commits, 193 files changed.

**Phase 1 — Adapter-level DI (groups + models + entry registrar)**
- All 4 adapters converted from `StorageOperationsFactory` to direct DI registration
- Group and model ops as `createImplementation` DI classes per adapter
- Entry ops bridged via `CmsEntryStorageOpsRegistrar` (interim step)

**Phase 2 — Per-method entry DI classes (DDB)**
- Extracted 1421-line monolithic factory into 22 individual DI classes
- Each class implements one per-method abstraction via `createImplementation`
- `DataLoadersHandler` converted to proper DI implementation
- `DdbEntryStorageOpsFeature` registers all 22 ops at app-scope

**Phase 3 — Per-method entry DI classes (SQL, DDB-ES, PG-OS)**
- SQL: 22 DI classes extracted from `SqlEntryOperationsImpl`, shared query logic in `queryHelpers.ts`
- DDB-ES: 22 DI classes extracted from 2146-line monolith, `CmsDdbEsDataLoaders` abstraction added
- PG-OS: 14 named impl classes delegating to WriteOps/SearchOps + 8 SQL DI classes reused directly

**Phase 4 — Remove all legacy infrastructure**
- Deleted `StorageOperationsFactory`, `HeadlessCmsStorageOperations` interface, `storageOperations` field
- Deleted `CmsEntryStorageOpsRegistrar`, `registerCmsEntryStorageOperations`
- Deleted `registerCmsStorageOperations`
- `HeadlessCmsFeature` no longer manages storage registration — adapters own it entirely

## Key decisions

- Entry ops registered at app-scope via adapter features (not per-request via registrar)
- `DataLoadersHandler` registered `.inSingletonScope()` — container is per-request so singleton = one instance per request = fresh cache
- Fake typed completeness maps dropped — `Implementation<Constructor>` accepts any impl for any key, providing false safety. Direct `container.register()` calls instead.
- PG-OS reuses SQL's per-method DI classes for 8 read methods (getRevisions, getByIds, etc.)
- `convertToStorageEntry`/`convertFromStorageEntry` extracted to shared `storageEntryUtils.ts` per adapter

## Current state

- Branch: `bruno/refactor/api-headless-cms-storage-ops`, 43 commits ahead of next (not pushed)
- Build: passing (all 5 affected packages)
- Tests: DDB 64/64 shards, SQL 64/64 shards, DDB-OS 64/64 shards, PG-OS 4/4 shards
- No legacy storage ops patterns remain in production code

## What might come next

- Remove `SqlEntryOperations` monolith class (kept for PG-OS backward compat — PG-OS's `EntryWriteOperations`/`SyncHelpers` still resolve it)
- Remove `CmsEntryStorageOperations` interface from types (monolithic entry ops type — individual adapters no longer use it)
- Clean up test infrastructure — `getStorageOps<HeadlessCmsStorageOperations>("cms")` pattern used in 20+ test files references deleted type
- Squash commits for cleaner PR history
