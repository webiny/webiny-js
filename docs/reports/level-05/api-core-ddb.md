# @webiny/api-core-ddb

> Level 5 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-core-ddb` is the DynamoDB implementation of `@webiny/api-core`'s `ApiCoreStorageOperationsFactory`: tenancy (tenants), security (API keys, roles, teams), admin users, a global key-value store, and DynamoDB-backed service discovery, all built on `@webiny/db-dynamodb`'s `createTable`/entity helpers. Every tenant-scoped table consistently keys records with a `T#{tenant}#...` partition-key prefix (and a `GSI_TENANT`/GSI1 index scoped the same way), so there is no missing-tenant-filter issue anywhere in this package's queries. One security finding was identified in `tenancy/index.ts` — see private notes.

## Public API
- `createApiCoreDdb` (`src/createApiCoreDdb.ts:14`) — builds the four storage-operations objects (`usersStorageOperations`, `tenancyStorageOperations`, `securityStorageOperations`, `keyValueStorageOperations`) and registers `DdbServiceManifestLoader`. Wired in by `ApiCoreDdbFeature` (`src/ApiCoreDdbFeature.ts:14`), which is consumed by exactly two concrete Lambda handler packages: `api-event-handler-aws-ddb` and `api-event-handler-aws-ddb-os` (codegraph).
- `DdbServiceManifestLoader` (`src/serviceDiscovery/DdbServiceManifestLoader.ts:6`) — re-exported from the barrel; queries the `GSI1` index for `SERVICE_MANIFESTS` records. It correctly sends a raw low-level `QueryCommand`/`unmarshall` pair through the `DynamoDBDocument` client (this bypasses the document client's own marshalling middleware, since that middleware only recognizes lib-dynamodb's own command classes) — the same pattern is used independently in `api-sync-system`'s `DeploymentsFetcher`, so this is an established, not broken, idiom in this codebase.
- `KeyValueStoreStorageOperations`/`KeyValueStoreDynamoTable` (`src/keyValueStore/*.ts`) — back `@webiny/api-core`'s `GlobalKeyValueStore` abstraction; intentionally not tenant-scoped (it is a process-global store, e.g. used for WCP license state), so the absence of a tenant filter here is by design, not a gap.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `packages/api-core-ddb/src/tenancy/index.ts` | Security finding SEC-14 — see private notes. | — | high |

No other bugs found. Tenant scoping was checked across `security/index.ts`, `adminUsers/index.ts`, and `tenancy/index.ts` (all key-building helpers embed `tenant` in the DynamoDB partition key) and no missing-filter cases were found. This package has no pagination/cursor codec of its own (all reads use `@webiny/db-dynamodb`'s `queryAll`, which returns the full result set rather than a page), so the level-4 `db-dynamodb` "ascii" cursor-decoding bug is not reachable from this package.

## Duplication
- `security/index.ts:302-345` (`createApiKey`) and `:346-364` (`updateApiKey`) build near-identical key/GSI-key objects and call `entities.apiKeys.put(...)` inside an equivalent try/catch (jscpd: 14-15 duplicated lines, two clone pairs at lines 302/332 and 71/346).
- `adminUsers/index.ts:43-64` (`createUser`) and `:133-153` (`updateUser`) are likewise near-identical blocks (jscpd: 16 duplicated lines at 43/133) — both build the same keys and call `entities.users.put(...)`.
- No cross-package reimplementation found: this package correctly reuses `@webiny/db-dynamodb`'s `sortItems`, `queryAll`, `createTable`, and `createEntityReader` rather than rolling its own equivalents (contrast with `api-core-sql`, which reimplements a slightly different `sortItems`).

## Dead code
None found. `createApiCoreDdb`, `ApiCoreDdbFeature`, and `DdbServiceManifestLoader` all have live consumers (codegraph, see Public API). `KeyValueStoreStorageOperations`/`KeyValueStoreDynamoTable` are consumed via `keyValueStore/index.ts`'s `createStorageOperations`, which is itself called from `createApiCoreDdb.ts:29`.

## Convention issues
- Inline object types recur in this package's factory-function signatures instead of named interfaces, e.g. `CreateTenancyStorageOperations`'s call signature `(params: { documentClient: DynamoDBDocument }): TenancyStorageOperations` (`src/tenancy/types.ts:8-10`) and the identical pattern in `src/keyValueStore/index.ts:4-6` (`CreateKeyValueStoreStorageOperations`). AGENTS.md conventions call for named interfaces rather than inline parameter object types; both are small but repeat the same anti-pattern in two places.

## Test gaps
The package's `__tests__` directory contains only Jest harness/setup files (`__api__/setupFile.js`, `presets.js`, `setupAfterEnv.js`) — there are no unit tests directly exercising `tenancy/index.ts`, `security/index.ts`, or `adminUsers/index.ts` in this package, including `getTenantsByIds` (relevant to the security finding above).

## Recommendations
1. Address the security finding in `tenancy/index.ts` — see private notes.
2. Add unit test coverage for `tenancy/index.ts`'s `getTenantsByIds`.
3. Deduplicate the `create*`/`update*` key-building blocks in `security/index.ts` and `adminUsers/index.ts` into a single shared "build keys, put, wrap error" helper per entity.
