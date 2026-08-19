# Session Handoff — 2026-07-28 — Full Storage Ops DI Migration

## What was done

- **Completed per-method DI migration for ALL CMS storage operations** — group (5 methods), model (5 methods), and entry (22 methods) across all 4 adapters (DDB, DDB-ES, SQL, PG-OS)
- **Removed all monolithic storage ops interfaces and implementations**: `CmsEntryStorageOperations`, `CmsGroupStorageOperations`, `CmsModelStorageOperations`, `StorageOperationsFactory`, `SqlEntryOperations`, `EntryWriteOperations`, `HeadlessCmsStorageOperations`
- **PG-OS write ops converted to decorator pattern** — 11 decorators wrap SQL per-method implementations with OpenSearch sync via `registerDecorator`
- **OpenSearch index event handlers extracted as proper DI classes** — `ModelAfterCreateHandler`, `ModelAfterCreateFromHandler`, `ModelAfterDeleteHandler` in `api-headless-cms-utils-os`, shared by DDB-ES and PG-OS
- **Fixed lazy-resolution bug** — `CmsEntryOpenSearchIndexCreate` was eagerly resolved during feature registration, preventing custom `CmsEntryOpenSearchIndex` registrations from being picked up
- **Cleaned up 24 test files** referencing deleted `HeadlessCmsStorageOperations` type
- **Introduced feature files per domain** — each adapter has `operations/{group,model,entry}/feature.ts` for clean registration
- 52 commits, 304 files changed, DDB 41/41 tests, DDB-ES 110/110 tests

## Key decisions

- Entry ops registered at app-scope via adapter features (container is per-request, singleton = per-request)
- One abstraction per file, one implementation per file
- PG-OS write ops use `registerDecorator` wrapping SQL per-method implementations (not `createImplementation` override)
- Shared utils (convertToStorageEntry, createKeys, etc.) as importable functions, not DI-injected
- OpenSearch index lifecycle handlers are shared DI classes in `api-headless-cms-utils-os`
- Feature files named `feature.ts` in `operations/{group,model,entry}/` directories
- Use `Abstraction.createImplementation()` convention (not standalone `createImplementation`)
- Use `format:fix` and `lint:fix` commands (not `format` and `lint`)

## Current state

- Branch: `bruno/refactor/api-headless-cms-storage-ops`, 52 commits ahead of next (not pushed)
- Build: passing (all affected packages)
- Tests: DDB 41/41, DDB-ES 110/110
- PG-OS: 9/9 passing (syncStream tests require running Postgres)
- Lint + format: clean

## What might come next

- Push branch and get CI green
- Squash commits for cleaner PR history before merge
- Remove `CmsGroupStorageOperations` and `CmsModelStorageOperations` param types from types.ts (currently kept for consumers)
- Remove deprecated `registerDynamoDbStorageOperations`, `registerCmsOpenSearchStorageOperations`, `registerSqlStorageOperations` wrapper functions
- Apply same per-method DI pattern to other subsystems (file manager, ACO, etc.)
