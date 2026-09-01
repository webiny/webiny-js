# Session Handoff — 2026-06-18 — Elasticsearch Tasks DI Refactor

## What was done

- Converted all 4 task definitions in `api-elasticsearch-tasks` from context-plugin factory pattern to `createImplementation` DI pattern (reindexing, enableIndexing, dataSynchronization, createIndexes)
- Extracted `DbRegistry` from `packages/db` into a proper DI abstraction + implementation + feature (`packages/db/src/features/DbRegistry/`), with export path `@webiny/db/exports/api/db.js` and `DbRegistryFeature` for container registration
- Converted `ElasticsearchSynchronize` to DI abstraction + implementation, inlined entity/table lookup logic (deleted `entities/` helpers)
- Converted `Manager` to non-generic DI abstraction + implementation with deps `[OpenSearchClient, DynamoDBClient, TaskController]`
- Converted `IndexSettingsManager` to DI abstraction + implementation with `[OpenSearchClient]`
- Replaced all dynamic `await import(...)` with static imports across task definitions
- Deleted: `getClients` helper, `SynchronizationContext` abstraction, `IElasticsearchTaskConfig` type, `entities/` folder, old `DbRegistry.ts`
- 10 commits, net -186 lines across 49 files

## Key decisions

- `Manager` dropped its generic type params (`<T, O>`) since generics moved to method-level usage; the DI container doesn't support class-level generics
- `IndexManager` stays non-DI because it requires per-run runtime config (`settings` from task input, optional `defaults`)
- `[OpensearchTenantIndexFactory, { multiple: true }]` syntax used for `resolveAll` in `createImplementation` dependencies
- `DbRegistryFeature` registered in `handler-db` via `createFeature` pattern with singleton scope
- `.gitignore` fixed: `db/` changed to `./db/` so it only ignores root-level `db/`, not `packages/db/`

## Current state

- Branch: `bruno/refactor/api-elasticsearch-tasks-di`
- Tests: not run (no test changes; package tests would need OpenSearch)
- Build: not run (lint + format passing)
- Unpushed commits: 10

## What might come next

- Run the `api-elasticsearch-tasks` test suite to verify DI wiring works end-to-end
- Consider converting remaining non-DI classes (`DisableIndexing`, `EnableIndexing`, task runners) if desired
- Apply similar DI patterns to other `api-*` packages that still use context-plugin factories
- Remove the `Db.registry` usage in `api-headless-cms-ddb-es/src/feature.ts` (it still calls `context.db.registry.register(...)` — should use the DI `DbRegistry` abstraction instead)
