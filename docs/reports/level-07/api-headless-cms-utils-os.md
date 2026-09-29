# @webiny/api-headless-cms-utils-os

> Level 7 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/api-headless-cms-utils-os` is the OpenSearch/Elasticsearch query-translation layer for CMS entries: it turns a model's fields into an `unmappedType`/`searchable`/`sortable` map (`operations/entry/elasticsearch/fields.ts`), builds the initial bool query with tenant/record-type filtering (`operations/entry/elasticsearch/initialQuery.ts`), recursively applies a `where` clause's AND/OR/field filters through a per-field-type filter registry (`CmsEntryOpenSearchExecFiltering`), builds sort clauses (`CmsEntryOpenSearchBodyBuilder/sort.ts`), and computes tenant-scoped index names (`CmsModelOpenSearchIndexProvider`). It builds correctly on `@webiny/api-opensearch`'s `createSort`/operator registry rather than reimplementing query-DSL construction. Overall health is reasonable and the DI wiring is consistent, but the package has zero automated tests (`__tests__/` does not exist), it constructs every CMS-entry index directly from `@webiny/api-opensearch`'s `getBaseConfiguration()` (`BaseOpenSearchIndex.ts`) and is therefore a concrete consumer of the dynamic-template glob/regex bug already identified at level 2, and its own `limit`-to-`size` translation has no upper bound of its own.

## Public API

- `CmsEntryOpenSearchBodyBuilder` (`src/features/CmsEntryOpenSearchBodyBuilder/CmsEntryOpenSearchBodyBuilder.ts:23`) — the main entry point: turns a model + GraphQL-style list params (`where`, `sort`, `search`, `after`, `limit`) into an OpenSearch `SearchBody`. Consumed by the OpenSearch-backed storage-operations packages (`api-headless-cms-ddb-es`, `api-headless-cms-pg-os`, per the level-2 report).
- `CmsModelOpenSearchIndexProvider` / `DefaultCmsModelOpenSearchIndexProvider` (`src/features/CmsModelOpenSearchIndex/*`) — resolves and caches (per `tenant:modelId`) the physical index name (`[tenant|"root", "headless-cms", modelId].join("-").toLowerCase()`) and the index body from `getBaseConfiguration()`; the sole point where index naming happens for CMS entries.
- `CmsEntryOpenSearchExecFiltering`, `CmsEntryOpenSearchFilterRegistry` + field filters (`DefaultFilter`, `ObjectFilter`, `RefFilter`) — the where-clause-to-query-DSL translation, extensible per field type via DI.
- `prepareEntryToIndex` / `extractEntriesFromIndex` (`src/helpers/entryIndexHelpers.ts`) — round-trips a CMS entry through the per-field-type `CmsEntryOpenSearchFieldIndex` registry (encryption/compression/JSON/date handling) when writing to / reading from the index.
- `createTestModelIndexName` (`src/testing/createTestModelIndexName.ts`) — test-only index-name helper, exported from `src/testing/index.ts`.

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|----------|----------------------|---------|-------------------|------------|
| 1 | medium | `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchIndex/BaseOpenSearchIndex.ts:9` | `BaseOpenSearchIndexImpl`'s constructor sets `this.body = getBaseConfiguration()` unmodified, and `DefaultCmsModelOpenSearchIndex.execute()` (`src/features/CmsModelOpenSearchIndex/DefaultCmsModelOpenSearchIndex.ts:7`) returns those `settings` as the body used to physically create every CMS-entry index. This is the concrete, production consumer of the level-2-reported bug where `getBaseConfiguration()`'s `ids`/`dates` dynamic templates use regex syntax (`"^id\|entryId$"`) while OpenSearch's default `match_pattern` is glob ("simple"). | Every CMS-entry index created by this package (`api-headless-cms-ddb-es`/`api-headless-cms-pg-os` via `CmsModelOpenSearchIndexProvider`) is created with these two dynamic templates permanently unable to match, so `id`/`entryId`/`createdOn`/`savedOn`/`publishedOn` fall through to the generic `strings` template or OpenSearch's own auto-detection instead of the intended explicit keyword/date mapping. This package has no test that indexes a real document and inspects the resulting field mapping, so the gap is invisible from here. | high (root cause already confirmed at level 2; this package's own code confirms it is a live, unmodified consumer with no test around it) |
| 2 | low | `packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchBodyBuilder/CmsEntryOpenSearchBodyBuilder.ts:121` | `size: (limit || 0) + 1` is computed directly from the caller-supplied `limit` with no upper bound enforced anywhere in this package (`grep` for `createLimit`/`MAX_LIMIT`/`max_result_window` in `src/` returns nothing). | If an upstream caller passes an unusually large `limit` through to `CmsEntryOpenSearchBodyBuilder.build()` without capping it first, this package will request that many results from OpenSearch (`size`) with no ceiling of its own; OpenSearch's own `index.max_result_window` (default 10,000) would eventually reject an excessive value, but this package provides no defense-in-depth against a caller that forgets to cap `limit` before reaching it. This audit did not trace the GraphQL/list-use-case layer (already covered by the level-6 `api-headless-cms` reports) to confirm whether a cap is applied before `limit` reaches this package. | medium — the absence of a cap in this package's own code is confirmed; whether it is exploitable end-to-end depends on a layer outside this package's dependency chain |

## Duplication

`features/CmsEntryOpenSearchFieldIndex/fields/TextEncryptedFieldIndex.ts` and `TextCompressedFieldIndex.ts` are near-identical (50 lines each, differing only in the `fieldType`/class name), per jscpd (80% duplicated lines/tokens on both). This is the expected shape for the per-field-type DI registry pattern used throughout the package and is low-risk, but a shared base implementation parameterized by `fieldType`/transform callables would remove the duplication. No cross-package duplication of `@webiny/api-opensearch`'s query-builder logic was found — `createSort` and the operator registry are consumed, not reimplemented.

## Dead code

None found with a single codegraph check each on the package's exported symbols; all of `CmsEntryOpenSearchBodyBuilder`, `CmsModelOpenSearchIndexProvider`, and the field-index/filter registries are wired into `CmsEntryOpenSearchUtilsFeature.ts` and have external consumers per the level-2 report's description of this package as a consumer of `api-opensearch`.

## Convention issues

None of significance found — the package consistently follows the DI abstraction/implementation split (one class per file, `abstractions.ts` + `feature.ts` per feature directory) required by AGENTS.md.

## Test gaps

The package has no `__tests__/` directory at all (confirmed via `find`), meaning none of the where-clause translation (`CmsEntryOpenSearchExecFiltering`, AND/OR nesting, per-field-type filters), sort translation (`createElasticsearchSort`), tenant-filter injection in `createInitialQuery`, or index-name/body construction (`CmsModelOpenSearchIndexProvider`, `BaseOpenSearchIndex`) is exercised by an automated test in this package. This is the most significant gap given the package's role: it is the single place that turns a `where`/`sort` into a physical OpenSearch query and index, and none of that logic — including the code paths implicated in Bug #1 — is verified by a test that actually builds a query or index body and inspects the result.

## Recommendations

1. Fix the dynamic-template regex/glob mismatch at its root in `@webiny/api-opensearch`'s `getBaseConfiguration()` (already flagged at level 2) and add a test in this package that creates an index via `BaseOpenSearchIndex`/`DefaultCmsModelOpenSearchIndex` and verifies `id`/`entryId`/`createdOn`/`savedOn`/`publishedOn` actually receive the intended keyword/date mapping, not just that the mapping config round-trips.
2. Add unit tests for `CmsEntryOpenSearchExecFiltering` (AND/OR nesting, each registered field filter) and `createElasticsearchSort`, since this package currently has none and is the sole translator from CMS `where`/`sort` to OpenSearch query DSL.
3. Confirm (in whichever package owns the GraphQL/list-use-case layer) that `limit` is capped before reaching `CmsEntryOpenSearchBodyBuilder.build()`, or add an explicit ceiling inside this package's `size` computation as defense-in-depth.
