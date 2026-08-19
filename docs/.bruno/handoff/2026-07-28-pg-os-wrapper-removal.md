# Session Handoff — 2026-07-28 — PG-OS Legacy Wrapper Removal

## What was done

- Removed `registerPgOsStorageOperations` legacy wrapper from `api-headless-cms-pg-os`
- Moved all infrastructure registrations (TableNameResolver, ValueFilter, FilterRegistries, SchemaManagers, SyncTableManager, SyncWriter) into `HeadlessCmsPgOsFeature.register(container, config)`
- Updated test setupFile to use `createRegisterExtensionPlugin(context => HeadlessCmsPgOsFeature.register(context.container, config))`
- Updated `src/index.ts` to export `HeadlessCmsPgOsFeature` instead of `registerPgOsStorageOperations`
- 1 commit, build passing, 9/9 non-infra tests green (6 syncStream tests fail due to pre-existing ECONNRESET)

## Key decisions

- Followed exact same pattern as `HeadlessCmsSqlFeature` — config as second param to `register`
- Test setupFiles continue using `createRegisterExtensionPlugin` wrappers (same rule as CMS packages — `processLegacyPlugins` indirection is separate future refactor)

## Current state

- Branch: `bruno/refactor/api-headless-cms-storage-ops`, 57 commits ahead of origin/next
- Build: passing (api-headless-cms-pg-os)
- Tests: 9/9 green (syncStream infra failures pre-existing)
- All CMS storage ops packages now fully migrated: ddb, ddb-es, sql, pg-os

## What might come next

- Remove remaining non-CMS legacy wrappers:
  - `registerAcoDdbStorageOperations` (api-aco-ddb)
  - `registerAcoSqlStorageOperations` (api-aco-sql)
  - `registerAuditLogsDdbStorageOperations` (api-audit-logs-ddb)
  - `registerAuditLogsSqlStorageOperations` (api-audit-logs-sql)
  - `registerApiCoreStorageOperations` (api-core)
- Push branch and get CI green
- Squash commits for cleaner PR history
- Eliminate `processLegacyPlugins` / plugin array indirection in test infrastructure
