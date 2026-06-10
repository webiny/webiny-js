# Handoff: CMS SQL Single-Table Rewrite

Date: 2026-06-08
Branch: `bruno/feat/api-headless-cms-sql-long-running-db`

## What We Did

Rewrote the entry storage layer of `@webiny/api-headless-cms-sql` from ~51 columns per entry row to 9 indexed columns + a JSON `data` blob.

## Key Documents

- **Design spec**: `docs/superpowers/specs/2026-06-08-cms-sql-single-table-design.md`
- **Implementation plan**: `docs/superpowers/plans/2026-06-08-cms-sql-single-table.md`
- **Current state**: `packages/api-headless-cms-sql/docs/CURRENT_STATE.md`
- **Design notes**: `packages/api-headless-cms-sql/docs/SINGLE_TABLE_DESIGN.md`

## What Changed

### Entry table schema (9 columns, static, never altered)
```sql
id TEXT PRIMARY KEY, entryId TEXT, modelId TEXT, tenant TEXT,
version INTEGER, isLatest BOOLEAN, isPublished BOOLEAN,
wbyDeleted BOOLEAN, data TEXT
```
3 composite indexes: `(tenant, modelId, isLatest)`, `(tenant, modelId, isPublished)`, `(tenant, modelId, entryId)`.

### Files changed
- `src/operations/entry/types.ts` — 9-field `IEntryRow`
- `src/operations/entry/mappers.ts` — `entryToRow` (JSON.stringify), `rowToEntry` (JSON.parse), `mergeEntryLevelMeta` (syncs *On/*By fields, skips immutable createdOn/createdBy and revision-prefixed fields)
- `src/operations/entry/index.ts` — all 22 operations rewritten
- `src/features/entryTableManager/EntryTableManager.ts` — DDL simplified to 9 columns
- `src/operations/group/index.ts` — restored SQL-level where filters (id, slug, isPlugin, isPrivate) that were accidentally removed
- `src/operations/model/index.ts` — restored SQL-level where filter (modelId) that was accidentally removed

### Key design decisions
- Every row is a revision. `isLatest`/`isPublished` are boolean tags, not record types.
- `data` column = `JSON.stringify(entry)`. Indexed columns are duplicated for SQL WHERE clauses.
- All writes that change indexed columns ALSO patch the `data` blob to keep them in sync.
- `create`/`createRevisionFrom` explicitly enforce `isLatest=true`.
- `update`/`publish`/`unpublish` read current DB flags before building `data` blob (prevents split-brain).
- Entry-level meta syncs to the **latest revision only** (not all siblings) via `syncToLatest()`.
- `patchAllRevisions()` used by move/moveToBin/restoreFromBin to update all revisions' data blobs.
- Groups and models have their own simple tables — untouched by this rewrite.

## Current State

### Build
`yarn build` passes clean.

### Tests
First run with `yarn test:sql packages/api-headless-cms` showed **850 passed / 12 failed / 16 skipped** (baseline was 820/42/16).

After fixing group/model list filters and changing `syncSiblings` (all siblings) to `syncToLatest` (latest only), a rerun of previously-failing shards showed **11 of 12 failures fixed**.

**One remaining failure** (not yet verified after the `syncToLatest` fix):
- `resolvers.read.test.ts` — "list entries that are not created between given dates" — expects 2 published entries but gets 1. Uses `savedOn_not_between` filter. This test passes with the old code. Root cause not yet identified.

### What Needs Doing
1. Run the full test suite: `yarn test:sql packages/api-headless-cms` (builds must be done first with `yarn build`)
2. Investigate and fix any remaining test failures
3. Run pre-commit checks and commit fixes
4. The test suite is sharded — run sequentially, never in parallel. Each shard takes ~10s when using 100 shards.

## Codebase Conventions
- Always `yarn build` (full project), never `yarn build -p @webiny/package`
- No `export default`, always named exports
- `/* */` comments, not `/** */`
- One named import per line
- Arrow functions for Knex query callbacks
- Tests run sequentially, never in parallel
- Pre-commit checklist: `git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .`
