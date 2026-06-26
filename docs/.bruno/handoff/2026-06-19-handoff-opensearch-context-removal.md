# Session Handoff — 2026-06-19 — Remove OpenSearch Context

## What was done

- Removed `OpenSearchContext` abstraction entirely — no more `context.opensearch` / `context.elasticsearch` mutation. The raw `Client` is now registered directly as an `OpenSearchClient` DI instance.
- Extracted `Manager` abstraction from `api-elasticsearch-tasks/src/types.ts` into its own `abstractions/Manager.ts`, renamed `elasticsearch` property to `openSearchClient`.
- Introduced `IndexManagerFactory` abstraction + implementation to replace direct `IndexManager` instantiation in task runners.
- Replaced all 15 plugin-based query builder operators (`OpenSearchQueryBuilderOperatorPlugin` subclasses) with DI-registered `OpenSearchQueryBuilderOperator` implementations using `createImplementation`, each registered as a singleton.
- Created `OpenSearchQueryBuilderOperatorRegistry` that collects all operators via `{ multiple: true }` DI injection — the same pattern as `CmsEntryOpenSearchFieldIndexRegistry`.
- Switched all `api-headless-cms-ddb-es` consumers from `PluginsContainer.byType()` to DI-resolved registry.
- Migrated all test helpers from an AWS-credential-requiring client to `getTestOpenSearchClient` from `~/testing/`, fixing all 21 test files (56 tests now passing locally without AWS credentials).
- 12 commits total, 196 files changed.

## Key decisions

- `OpenSearchClient` receives the raw `Client` directly at feature registration time (`container.registerInstance`) — no intermediate context wrapper.
- Query builder operators are pure DI citizens: individually overridable via `container.register()`, singleton-scoped, collected via `{ multiple: true }` in the registry.
- `PluginsContainer` is still passed through to `createEntriesStorageOperations` for `StorageOperationsCmsModelPlugin` — that's the next plugin to move to DI.
- Test files use `getTestOpenSearchClient()` (direct `@opensearch-project/opensearch` `Client`) instead of the AWS SDK signer-based client. Old `helpers.ts` deleted.

## Current state

- Branch: `bruno/refactor/remove-opensearch-context`
- Tests: 56 passed (api-opensearch), 0 failures
- Build: passing (api-opensearch, api-headless-cms-ddb-es both clean)
- Unpushed commits: 12

## What might come next

- Remove `StorageOperationsCmsModelPlugin` dependency from `createEntriesStorageOperations` (last `PluginsContainer` usage in the entry operations pipeline).
- Convert remaining OpenSearch plugin types to DI (`OpenSearchFieldPlugin`, `OpenSearchBodyModifierPlugin`, `OpenSearchQueryModifierPlugin`, `OpenSearchSortModifierPlugin`, `OpenSearchIndexPlugin`).
- Remove `PluginsContainer` from `StorageOperationsFactoryParams` once all plugin consumers are migrated.
- Consider removing the `context.__registeredOpensearch` guard in favor of DI singleton guarantees.
