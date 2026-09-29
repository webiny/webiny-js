# @webiny/api-websockets-sql

> Level 6 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-websockets-sql` is the Knex/SQL storage variant of `@webiny/api-websockets`'s `ConnectionRegistry`: a single `WebsocketsConnections` table (one row per live connection, columns for identity/tenant/endpoint/timestamps) with a lazy create-and-migrate-on-every-call pattern, plus a `lastSeen` column and `listStale` query that (unlike the DynamoDB variant in `api-websockets-aws`, which no-ops both) actually implements the stale-connection cleanup the level-5 `api-websockets` report flagged as unwired. Overall health is good — tenant/identity filtering in every read method uses parameterized `.where()` calls, and `toIsoString` carefully normalizes cross-dialect timestamp shapes — but every one of the eight public methods repeats an identical three-call schema-check preamble on every single invocation, which is real, jscpd-confirmed duplication and an avoidable per-call cost (three extra round-trips: `hasTable`, then two `hasColumn` checks) that the sibling `self-hosted-auth-sql` package's shared `TableManager` pattern avoids by caching verification per table.

## Public API
- `WebsocketsConnectionRegistry` (`src/WebsocketsConnectionRegistry.ts:277`) — the `ConnectionRegistry.Interface` implementation; registered by `WebsocketsSqlFeature`, consumed by `packages/api-event-handler-standalone-sql/src/createWebinyApiHandler.ts` (the sole SQL-backed project template, codegraph) alongside `api-websockets-standalone`'s transport.
- `WebsocketsSqlFeature` (`src/WebsocketsSqlFeature.ts:10`) — registers the table-name resolver and the registry; 2 callers (codegraph): the standalone-sql handler and this package's own `src/index.ts`.
- `TableName` (`src/TableName/abstractions.ts`) — a small DI abstraction for prefixing the table name, private to this package (not used by `api-core-sql`'s own `TableManager.resolve`, which does the same job for tables it manages).

## Bugs
None found with high confidence. One portability concern worth tracking: `WebsocketsConnectionRegistry.ts`'s one-time `migrateTable()` (lines 236-241) backfills the new `endpoint` column with `this.knex.client.raw("'https://' || \"domainName\" || '/' || \"stage\"")`. `||` is the SQL-standard string-concatenation operator (works on Postgres and SQLite, both already used elsewhere in the SQL packages), but on MySQL `||` is logical OR by default (`PIPES_AS_CONCAT` is not Webiny's default `sql_mode`), so a pre-existing MySQL-backed installation upgrading through this migration would silently populate `endpoint` with `0`/`1` instead of the intended URL rather than erroring. Confidence is medium because the repo's SQL packages don't declare a specific target dialect list; if MySQL is not an actually-supported backend for this feature this does not apply.

## Duplication
jscpd flagged three pairs inside `packages/api-websockets-sql/src/WebsocketsConnectionRegistry.ts` (lines ~92-100, ~112-120, ~132-140, ~152-158), all instances of the same `await this.ensureTable(); await this.migrateTable(); await this.migrateLastSeen();` preamble that in fact appears at the top of all eight public methods (`register`, `unregister`, `listViaConnections`, `listViaIdentity`, `listViaTenant`, `listAll`, `updateLastSeen`, `listStale`). This is more repetition than jscpd's pairwise report shows (it only pairs up windows past its minimum-line threshold). `@webiny/api-core-sql`'s `TableManager` (used by `self-hosted-auth-sql`, see that report) solves the identical "lazily create the table, once" problem with a class that caches which tables it has already verified — this package could reuse the same pattern (or `TableManager` itself) instead of re-checking schema on every call.

## Dead code
None found. `TableName`/`toIsoString` and all eight registry methods are reachable from the registered feature.

## Convention issues
None found. One abstraction/implementation per file (`TableName`, `WebsocketsConnectionRegistry`), DI naming follows the `Impl`-suffixed-class/interface-matching-abstraction pattern.

## Test gaps
`__tests__/WebsocketsConnectionRegistry.test.ts` and `__tests__/toIsoString.test.ts` exist, but codegraph shows no test reachable from `WebsocketsSqlFeature`'s registered DI wiring within 3 caller hops of `KnexClient`'s 45 total callers — i.e. there's no test asserting the feature-level registration (`WebsocketsSqlFeature.register`) actually wires a working `ConnectionRegistry` end to end via the shared `KnexClient`. The `migrateTable`/`migrateLastSeen` schema-evolution paths (dropping `domainName`/`stage`, backfilling `endpoint`) also don't appear to have a dedicated migration test exercising a pre-migration row shape.

## Recommendations
1. Replace the repeated `ensureTable`/`migrateTable`/`migrateLastSeen` preamble in all eight methods with a single cached "verified" flag (or reuse `@webiny/api-core-sql`'s `TableManager`), removing both the duplication and the per-call schema-introspection cost.
2. Confirm which SQL dialects this feature is meant to support; if MySQL is one of them, rewrite the `endpoint` backfill in `migrateTable` using a dialect-neutral Knex `CONCAT`/string-builder instead of a raw `||` expression.
3. Add a feature-level test that registers `WebsocketsSqlFeature` against a real `KnexClient` and exercises register → list → unregister, to cover the schema-migration path the unit test doesn't reach.
