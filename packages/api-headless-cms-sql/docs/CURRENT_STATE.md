# api-headless-cms-sql — Current State

Branch: `bruno/feat/api-headless-cms-sql`
Date: 2026-06-08
Test command: `yarn test:sql packages/api-headless-cms`
Test score: **850 passed / 12 failed / 16 skipped (878 total)**

## What This Package Is

SQL storage backend for Webiny Headless CMS. Alternative to `api-headless-cms-ddb` (DynamoDB). Uses Knex.js for query building. Tests run against SQLite (better-sqlite3) in-memory.

## What's Done

All 22 entry storage operations are implemented. Group and model CRUD is done. The full DI feature set is wired up: schema management, table name resolution, entry table management.

## Package Structure

```
packages/api-headless-cms-sql/src/
├── index.ts                        # registerSqlStorageOperations() — main entry
├── types.ts                        # SqlStorageOperationsFactory, CmsContext
├── features/
│   ├── knexInstance/                # Knex instance abstraction + factory
│   ├── tableNameResolver/          # Tenant-scoped table naming
│   ├── groupSchemaManager/         # Group table DDL
│   ├── modelSchemaManager/         # Model table DDL
│   └── entryTableManager/          # Entry table DDL (9 columns + data blob)
├── operations/
│   ├── group/                      # Group CRUD + mappers
│   ├── model/                      # Model CRUD + mappers
│   └── entry/                      # All 22 entry methods + mappers (JSON blob)
```

## Key Design Decisions

- **Single table:** One `webiny_cms_entries` table with 9 indexed columns (`id`, `entryId`, `modelId`, `tenant`, `version`, `isLatest`, `isPublished`, `wbyDeleted`) + a `data` TEXT column containing `JSON.stringify(entry)`.
- **One row per revision:** Boolean `isLatest`/`isPublished` flags tag which revision is latest/published. No separate L/P records like DDB.
- **JSON data blob:** All entry data (values, identity, dates, meta, location, etc.) stored as JSON text. No per-field columns.
- **In-memory filtering:** SQL only filters by indexed columns. Complex CMS field filtering and sorting done in-memory via db-utils.
- **Batched sibling sync:** Entry-level meta synced to all sibling revisions via a single CASE/WHEN UPDATE.
- **Model-free mappers:** `entryToRow`/`rowToEntry` don't need the CMS model — just JSON.stringify/parse.

## Coding Conventions (Enforced)

- Arrow functions for Knex query callbacks: `(qb) => { qb.where(...) }`, never `function(this)`.
- One named import per line.
- No `export default`, always named exports.
- Class `Impl` suffix, export const matches abstraction name.
- `/* */` comments, not `/** */`.
- `public`/`protected`/`private` + `readonly` on all class properties.
- No one-liners with `await` + `return` — assign to const, then return.
- Break chained calls across lines.

## Test Infrastructure

- `yarn test:sql` env: `WEBINY_STORAGE=sql,ddb` (DDB fallback for apiCore features).
- SQLite in-memory via `better-sqlite3` (needs `dependenciesMeta.better-sqlite3.built: true` in root `package.json`).
- `setupAfterEnv.js` drops ALL SQLite tables in `beforeEach` + bumps `globalThis.__schemaRegistryVersion` to invalidate SchemaRegistry cache.
- Knex instance created once in `setupFile.js`, shared across all test handlers.

## Remaining Failures

12 tests still fail (down from 42). Remaining failures are in `import.structure.test.ts` and `security/basePermissions.test.ts` — pre-existing issues unrelated to the SQL storage layer.
