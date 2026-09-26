# @webiny/api-core-sql

> Level 5 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-core-sql` is the Knex/SQL implementation of `@webiny/api-core`'s `ApiCoreStorageOperationsFactory`: tenancy, security (API keys, roles, teams), admin users, key-value store, and service discovery, plus a small `TableManager` that lazily creates/tracks tables and a `KnexClient` DI abstraction consumed elsewhere via `@webiny/handler`'s `registerExtensions` mechanism. Every tenant-scoped table is a composite-primary-key `(tenant, id)` table and every query in `security/index.ts` and `adminUsers/index.ts` includes an explicit `.where("tenant", tenant)`, so tenant scoping is consistently correct. One security finding was identified in `tenancy/index.ts` — see private notes. Separately, this package reimplements `sortItems` (`src/sortItems.ts`) with different, more permissive semantics than the `sortItems` `api-core-ddb` reuses from `@webiny/db-dynamodb` — a real behavioral drift between the two backends, though not currently reachable given the codebase's camelCase field naming (see Duplication).

## Public API
- `createApiCoreSql`/`ApiCoreSqlFeature` (`src/createApiCoreSql.ts:16`, `src/ApiCoreSqlFeature.ts:15`) — the SQL storage-operations factory; `ApiCoreSqlFeature` has exactly one consumer, `api-event-handler-standalone-sql`'s `createWebinyApiHandler.ts` (codegraph).
- `KnexClient`/`KnexClientFeature` (`src/feature/KnexClient/*.ts`) and `registerSQLCore` (`src/index.ts:17`) — a `createRegisterExtensionPlugin`-based extension (the `@webiny/handler` mechanism) that registers the shared `Knex` instance into the per-request container so other SQL-backed feature packages can resolve it.
- `getSqlTablePrefix` (`src/getSqlTablePrefix.ts:1`) — exported from the barrel but has zero consumers anywhere in the monorepo (grep across `packages/`); the actual table prefix used at runtime is the `tableNamePrefix` passed explicitly into `ApiCoreSqlFeature`/`createApiCoreSql`/`TableManager`, not this env-var helper (dead code, see below).

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `packages/api-core-sql/src/tenancy/index.ts` | Security finding SEC-14 — see private notes. | — | high |
| 2 | medium | `packages/api-core-sql/src/TableManager.ts:31-48` | `TableManager.ensure()` checks `this.verified.has(resolved)`, then `await this.knex.schema.hasTable(resolved)`, then (if missing) `await this.knex.schema.createTable(...)`, with no lock/mutex around the two awaits. Every storage-operations method (`getUser`, `getRole`, `getTenantsByIds`, etc.) calls its own `ensureTable()`/`ensure()` *outside* the method's try/catch (e.g. `security/index.ts:93`, `tenancy/index.ts:69`), so any error `ensure()` throws is not wrapped in a `WebinyError`. | If two concurrent requests hit a cold container (or a shared long-lived Knex connection under concurrent request handling) and both call a method touching the same not-yet-created table before either's `hasTable()` resolves, both will see `exists === false` and both call `createTable()`; the second `CREATE TABLE` throws a raw, unwrapped SQL error ("table already exists") instead of the driver returning cleanly, and that raw error propagates instead of a `WebinyError`-wrapped one. | medium |

## Duplication
- `security/index.ts:49-61` (`ensureRolesTable`) and the very similar `ensureTeamsTable`/`ensureApiKeysTable` blocks (jscpd flagged clones at lines 49/61 and 124/230) — three near-identical `tableManager.ensure(...)` calls differing only in column list; a small helper could parameterize this.
- Cross-package drift: `src/sortItems.ts:1-43` reimplements `@webiny/db-dynamodb`'s `sortItems` (`packages/db-dynamodb/src/utils/sort.ts:65`) with different semantics. The db-dynamodb version (used by `api-core-ddb`) splits a sort string on `"_"` and **requires exactly two parts** (`result.length !== 2` throws `SORT_ERROR`), so a sort key like `"first_name_ASC"` would throw. This package's own version instead pops the last `_`-separated segment as the direction and rejoins the rest as the field name, so it tolerates field names containing underscores. In practice this is not currently exploitable since all sortable fields in these packages are camelCase (`createdOn`, `id`, `slug`), so no real sort key produces more than two `"_"`-separated parts today — but it is a genuine, confirmed behavioral difference between the two backends' sort handling for the same `sort: string[]` input contract.

## Dead code
- `getSqlTablePrefix` (`src/getSqlTablePrefix.ts:1`, re-exported at `src/index.ts:8`) — grep across the monorepo shows no importer besides the package's own `dist` output; codegraph confirms no callers. Runtime table-prefix resolution goes through the `tableNamePrefix` constructor parameter instead.

## Convention issues
- `TableManager` (`src/TableManager.ts:14-21`) pushes `this` onto a `globalThis.__sqlTableManagers` array in its constructor as a side effect, which is an unusual, implicit global-registry pattern not seen elsewhere in this slice of the codebase and isn't documented at its call site — worth a comment explaining why (likely test-cleanup/reset support) since it's easy to miss when reviewing `new TableManager(...)` call sites.
- No inline-type or DI-naming violations found; `createApiCoreSql`/`createStorageOperations` factories consistently take a named `CreateStorageOperationsParams` interface rather than inline object types.

## Test gaps
Same as `api-core-ddb`: `__tests__` contains only Jest setup/preset harness files, no unit tests directly exercising `tenancy/index.ts` (including `getTenantsByIds`, relevant to the security finding above), `security/index.ts`, `adminUsers/index.ts`, or `TableManager`'s concurrent-`ensure()` behavior. The `sortItems` semantic drift documented above also has no test locking in either backend's exact behavior for edge-case sort keys.

## Recommendations
1. Address the security finding in `tenancy/index.ts` — see private notes.
2. Guard `TableManager.ensure()` against concurrent double-create (e.g. an in-flight-promise map keyed by table name, or catch-and-ignore a "table already exists" error) and make sure the resulting error is wrapped consistently with the rest of each storage operation's error handling.
3. Remove the dead `getSqlTablePrefix` export, or wire it into `createApiCoreSql`/`ApiCoreSqlFeature` if an env-var-driven prefix was actually intended.
