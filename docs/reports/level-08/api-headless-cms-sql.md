# @webiny/api-headless-cms-sql

> Level 8 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-headless-cms-sql` is the Knex/SQL storage-operations implementation of the same entry/model/group interfaces `@webiny/api-headless-cms-ddb` implements for DynamoDB. It stores each entry revision as one row in a single table with a JSON blob column (`data: JSON.stringify(entry)`) plus a handful of indexed columns (`tenant`, `modelId`, `entryId`, `version`, `isLatest`, `isPublished`, `wbyDeleted`), and — like the DDB backend — delegates all `where`/sort logic to `@webiny/api-headless-cms-storage`'s in-memory `filter`/`sort` rather than pushing it into SQL. Every entry query in the audited paths (`SqlListEntries`, `SqlGetEntriesByIds`, `SqlGetLatestEntriesByIds`, `SqlGetPublishedEntriesByIds`, `SqlGetRevisions`, `SqlPublishEntry`, `SqlUnpublishEntry`, `SqlDeleteEntryRevision`) is tenant-scoped and free of SQL injection: every Knex call uses parameter binding, and the one raw-SQL fragment (a bulk `CASE id ... END` update in `queryHelpers.patchAllEntryRevisions`) only interpolates server-generated ids/JSON via `?` placeholders, never a field id or `where` key from user input. Batch-get operations build a `Map` keyed by the requested id/entryId and look results up by that map, so there is no positional-misalignment risk like the level-4/5 tenant-loader bug (SEC-14). One confirmed cross-backend ordering drift was found against `api-headless-cms-ddb` (see Bugs), and — despite shipping SQLite/Postgres/PGlite test-harness infrastructure — this package's own test suite has zero executable test files.

## Public API
- `HeadlessCmsSqlFeature` (`src/index.ts:20`) — the top-level DI feature; wires `TableNameResolverFeature` (shared vs. per-tenant table naming via `WEBINY_SHARED_TABLES`), `GroupSchemaManagerFeature`/`ModelSchemaManagerFeature`/`EntryTableManagerFeature` (lazy per-table schema creation, mirroring `api-core-sql`'s `TableManager` pattern noted in the level-5 report), and the three `Sql*StorageOpsFeature`s.
- `SqlCreateEntry` … `SqlGetUniqueFieldValues` (20 classes in `src/operations/entry/*.ts`) — each implements one `@webiny/api-headless-cms` `*StorageOperation` interface and is consumed, like the DDB equivalents, one-to-one by the corresponding use case in `api-headless-cms`'s `features/contentEntry/*` slice.
- `Sql*Group`/`Sql*Model` (`src/operations/group/*.ts`, `src/operations/model/*.ts`) — the model/group storage-operation equivalents.
- `EntryTableManager`/`GroupSchemaManager`/`ModelSchemaManager`/`TableNameResolver` (`src/features/*/abstractions.ts`) — DI abstractions for lazy table creation and table-name resolution; consumed internally by every `Sql*` operation above via `KnexClient` + `EntryTableManager`/etc.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `packages/api-headless-cms-sql/src/operations/entry/SqlGetRevisions.ts:41` | `.orderBy("version", "desc")` returns an entry's revisions newest-first, whereas `api-headless-cms-ddb`'s equivalent (`DdbGetRevisions.ts`, via `dataLoader/getAllEntryRevisions.ts:14-23`) queries DynamoDB with no reverse option, which defaults to ascending (oldest-first) sort-key order. | Listing an entry's revision history (the "revisions" panel/API) returns entries in the opposite chronological order depending on which storage backend the API is deployed against. | high |
| 2 | low | `packages/api-headless-cms-sql/src/operations/entry/SqlPublishEntry.ts`, `SqlUnpublishEntry.ts` | Security finding SEC-48 — see private notes. | — | medium |

## Duplication
jscpd reports 16.24% duplicated lines across 30 clones (higher than the DDB package's 9.35%). Most of it is the identical constructor/DI boilerplate at the top of nearly every `Sql*` class (`private readonly knex: Knex; public constructor(knexClient: KnexClient.Interface, private readonly entryTableManager: EntryTableManager.Interface) { this.knex = knexClient.client; }`), which jscpd flags against `SqlUpdateEntry.ts:15-31` from more than a dozen other files. `SqlGetUniqueFieldValues.ts:21-38,47-60` / `SqlListEntries.ts:21-38,44-57` and `SqlGetEntry.ts:7-40` / `SqlListEntries.ts:7-40` overlap because both delegate through the same `listEntries()` helper in `queryHelpers.ts`. `SqlMoveToBin.ts:21-49` / `SqlRestoreFromBin.ts:25-52` and `SqlPublishEntry.ts` / `SqlUnpublishEntry.ts:15-48` are structural mirrors of each other, matching the same pattern seen in the DDB package. `GroupSchemaManager.ts:4-29` / `ModelSchemaManager.ts:4-29` share table-existence-check logic. None of this is behavior-affecting.

Separately, this package writes a `live: ICmsEntryLive | null` field (documented in `@webiny/api-headless-cms` as "is this CMS Entry live, no matter the revision", `packages/api-headless-cms/src/types/types.ts:432`) onto entry rows via two different maintenance strategies within the same package: `SqlPublishEntry.ts:65` and `SqlUnpublishEntry.ts:49` update `live` only on the single `latest` row (via `queryHelpers.syncEntryToLatest`), while `SqlDeleteEntryRevision.ts:49,59` propagates `live: null` onto every revision row of the entry (via `queryHelpers.patchAllEntryRevisions`). Given the field's own documented meaning ("no matter the revision"), reading `.live` off a non-latest revision after a publish/unpublish — as opposed to after a revision delete — would return whatever value that row was last written with rather than the entry's current live state. Confidence: medium (the exact GraphQL read paths that surface `.live` to end users were not traced as part of this audit).

## Dead code
No dead exports confirmed via a targeted check beyond the general duplication noted above.

## Convention issues
No inline-type or barrel-export violations found; `src/index.ts` exports only the single `HeadlessCmsSqlFeature`, consistent with the repo's minimal-barrel-export convention. The repeated constructor boilerplate noted under Duplication is a structural side effect of "one abstraction per file" rather than a violation of it.

## Test gaps
- `packages/api-headless-cms-sql/__tests__` contains only test-harness/setup files (`setupFile.js`, `presets.js`, `setupAfterEnv.js`, `createSqliteClient.js`, `createPgClient.js`, `createPgliteClient.js`) — there is not a single `*.test.ts` file anywhere in the package, despite the harness being built to support three SQL dialects (SQLite, Postgres, PGlite).
- None of the entry lifecycle (create/publish/unpublish/move-to-bin/restore-from-bin/delete), batch-get, list/filter/sort, or table-manager logic has any automated test coverage in this package.
- The revision-ordering drift (Bug #1) and the `live`-field maintenance inconsistency (Duplication) are both exactly the kind of behavior this missing test suite would have caught.

## Recommendations
1. Resolve the revision-ordering drift with `api-headless-cms-ddb`: pick one canonical order for "list an entry's revisions" (ascending or descending) and enforce it consistently, ideally with a test shared across both backends.
2. Write actual tests using the existing SQLite/Postgres/PGlite harness — the harness exists and is wired into the test setup, but the entire entry storage-operations surface (20 classes) currently ships with zero automated verification.
3. Unify the `live` field's maintenance strategy: either have `SqlPublishEntry`/`SqlUnpublishEntry` also propagate to all revisions (matching `SqlDeleteEntryRevision`'s `patchAllEntryRevisions` approach), or narrow the field's documented meaning to "live status of the latest revision" if that is the intended semantics.
