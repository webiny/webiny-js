# Session Handoff — 2026-07-28 — Remove Deprecated Storage Ops Wrappers

## What was done

- Removed 3 deprecated `register*StorageOperations` wrapper functions that were thin `createRegisterExtensionPlugin` shells around the new DI Features
- Deleted `registerDynamoDbStorageOperations` from `api-headless-cms-ddb/src/index.ts`
- Deleted `registerCmsOpenSearchStorageOperations` from `api-headless-cms-ddb-es/src/feature.ts` and its re-export from `index.ts`
- Deleted `registerSqlStorageOperations` from `api-headless-cms-sql/src/index.ts`
- Migrated all 4 callers to use `HeadlessCmsDdbFeature`, `HeadlessCmsDdbEsFeature`, `HeadlessCmsSqlFeature` directly
- In `api-event-handler-server-sql`, CMS storage ops now register as a clean DI Feature alongside other Features, removed from `registerExtensions` legacy block
- Cleaned up unused `createRegisterExtensionPlugin` imports from source files
- 1 commit, 9 files changed, build and tests green (DDB 41/41, DDB-ES 110/110)

## Key decisions

- Test setupFiles still return plugins arrays with `createRegisterExtensionPlugin` wrappers because `processLegacyPlugins` in `createCmsTestHandler` processes them. Eliminating that indirection entirely is a larger refactor deferred for later.
- `ISqlStorageOperationsConfig` interface kept in `api-headless-cms-sql/src/index.ts` since `HeadlessCmsSqlFeature.register()` uses it as its config type.

## Current state

- Branch: `bruno/refactor/api-headless-cms-storage-ops`, 55 commits ahead of `origin/next` (not pushed)
- Build: passing (all 4 affected packages)
- Tests: DDB 41/41, DDB-ES 110/110 passing
- Working tree: clean

## What might come next

- Push branch and get CI green
- Squash commits for cleaner PR history
- Eliminate `processLegacyPlugins` indirection in test infrastructure (have setupFiles export `register(container)` instead of plugin arrays)
- Apply same per-method DI pattern to other subsystems (ACO, audit-logs still use legacy `register*StorageOperations` wrappers)
