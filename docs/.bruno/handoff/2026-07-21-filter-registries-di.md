# Session Handoff — 2026-07-21 — Filter Registries DI

## What was done

- Replaced `PluginsContainer` threading with 4 DI-resolvable registries across `api-headless-cms-storage`, `api-headless-cms-sql`, `api-headless-cms-pg-os` (16 commits)
- Created 4 registry abstractions: `FieldFilterPathRegistry`, `FieldFilterValueTransformRegistry`, `FieldFilterCreateRegistry`, `FieldSortingRegistry`
- Created 4 Map/Array-backed implementations following `features/<name>/` convention
- Extracted 7 handler factories from existing plugin factories (path, transform, filter create)
- Created `FilterRegistriesFeature` to register all handlers at container setup
- Refactored consumer functions (`createFields`, `createExpressions`, `filter`, `sort`) to accept registries instead of `PluginsContainer`
- Removed `plugins: PluginsContainer` from entire param chain in sql and pg-os packages
- Removed unused `@webiny/plugins` dependency from `api-headless-cms-sql`
- Design spec: `docs/.bruno/specs/2026-07-20-cms-storage-filter-registries-di-design.md`
- Implementation plan: `docs/.bruno/plans/2026-07-20-cms-storage-filter-registries-di.md`

## Key decisions

- `registerInstance` used instead of `registerFactory` for singleton registry behavior (registerFactory creates new instances on every resolve())
- Plugin classes (`CmsEntryFieldFilterPathPlugin`, etc.) kept unchanged for ddb/ddb-es backward compat
- `getMappedPlugins()` utility kept for same reason
- Handler factories live in `src/handlers/` (not in feature folders) since they're factory functions, not DI implementations
- Registries structured as `features/<name>/{abstractions.ts, <ClassName>.ts}` matching codebase DI convention
- `FieldSortingRegistry` registered empty (no handlers) — sql/pg-os don't use sorting plugins, only ddb does
- `FilterRegistriesFeature` registered in both sql and pg-os feature registration blocks (idempotent via registerInstance)

## Current state

- Branch: `bruno/feat/api-postgres-to-os`, 16 commits ahead of origin/next (not pushed)
- Tests: 15 passed (api-headless-cms-storage), 9 passed (api-headless-cms-pg-os)
- Build: passing
- Lint/format: clean
- Working tree: clean

## What might come next

- Remove PluginsContainer from ddb and ddb-es packages (same pattern, now proven)
- Delete plugin classes once all backends migrated to registries
- Full CMS integration tests with WEBINY_STORAGE=pg-os against real OpenSearch
- WAL listener infrastructure for PG-to-OpenSearch sync
- Push commits and create PR
