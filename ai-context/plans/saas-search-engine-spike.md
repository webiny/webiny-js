# SaaS search engine spike: OpenSearch vs turbopuffer vs LanceDB

Spike, October 2026. Nothing here ships. It's input for deciding what Webiny SaaS should search with.

## The question

Webiny SaaS runs thousands of tenants (prospects at 5k and 50k), and each tenant builds its own content models, pages and files. Today that goes to OpenSearch, with an index per tenant per model, or one shared index per model when `OPENSEARCH_SHARED_INDEXES` is on.

Neither OpenSearch layout holds up at that scale with per-tenant models:

- Index per tenant per model gives 10k tenants × 15 models = 150k indexes. OpenSearch's default limit is 1000 shards per data node, and every index costs cluster state whether anyone queries it or not.
- Shared indexes merge every tenant's fields into one mapping. Fields built in the admin UI get random storage IDs, so the mapping grows with every tenant until it hits the field limit (1000 by default). Fields built in code don't have this problem because their storage ID is `type@fieldId` (`packages/api-headless-cms/src/features/modelBuilder/fields/DataFieldBuilder.ts:432`).

The candidates were turbopuffer (managed, object storage with a cache tier, namespace per tenant+model) and LanceDB (open source, embedded in our Lambdas, Lance files on our own S3).

## Recommendation

Use turbopuffer for SaaS, with a namespace per tenant+model. Keep `ddb+os` for self-hosted deployments.

- Turbopuffer can express everything the CMS list API sends to OpenSearch today. Some operators change semantics slightly, and total counts need a second query (details below).
- LanceDB can express it too, but on Lambda a cold request took 2.1 to 2.6 s and every query read from S3. We would have to build compaction, caching and index upkeep for tens of thousands of tables ourselves. That's turbopuffer's product, rebuilt worse.
- Before building anything, make field indexing explicit (filterable, sortable, searchable flags with a cap per model). It shrinks the mapping work and the turbopuffer bill, and it's needed whichever engine wins.

Turbopuffer itself is not benchmarked yet because there was no API key on the machine. That's the first follow-up.

## What the CMS asks of the search engine

Everything below goes through `CmsEntryOpenSearchBodyBuilder` (`packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchBodyBuilder/CmsEntryOpenSearchBodyBuilder.ts`). Files, pages, ACO folders and Website Builder data are CMS models with no direct OpenSearch code, so porting CMS entry storage covers them.

### Where operators

Operators live in `packages/api-opensearch/src/features/OpenSearchQueryBuilderOperator/operators/`.

| CMS operator                   | OpenSearch today                                                             | turbopuffer                         | LanceDB (SQL filter)      |
| ------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------- | ------------------------- |
| `eq`                           | `term`; null becomes `must_not exists`                                       | `Eq` (null matches missing)         | `=` / `IS NULL`           |
| `not`                          | `must_not term`; null becomes `exists`                                       | `NotEq`                             | `!=` / `IS NOT NULL`      |
| `in`                           | `terms`                                                                      | `In`                                | `IN (...)`                |
| `not_in`                       | `must_not terms`                                                             | `NotIn`                             | `NOT IN (...)`            |
| `and_in`                       | one `term` per value (all must match)                                        | `And` of `Contains`                 | `array_has_all`           |
| `gt`, `gte`, `lt`, `lte`       | `range`                                                                      | `Gt`, `Gte`, `Lt`, `Lte`            | `>`, `>=`, `<`, `<=`      |
| `between`, `not_between`       | `range` / `must_not range`                                                   | `And(Gte, Lte)` / `Not(...)`        | `BETWEEN` / `NOT BETWEEN` |
| `contains`, `not_contains`     | `query_string` with `*value*` on the analyzed field, `default_operator: and` | `IGlob` per word, joined with `And` | `ILIKE '%word%'` per word |
| `startsWith`, `not_startsWith` | `match_phrase_prefix`                                                        | `Glob 'value*'`                     | `LIKE 'value%'`           |
| `AND`, `OR` (nested)           | `bool` with `must` / `should` + `minimum_should_match`                       | `And`, `Or` (nestable)              | `AND`, `OR`               |

Two semantic differences to decide on:

- `contains` today matches per token, case-insensitive, because it runs `query_string` against analyzed text. "red car" matches "the car is red". A single `IGlob '*red car*'` would require the words to be adjacent, so the mapping splits on whitespace and ANDs one glob per word. That keeps today's behaviour.
- `startsWith` today uses `match_phrase_prefix`, which matches a phrase prefix at any word position. "car" matches "red car". `Glob 'car*'` only matches at the start of the string. That's arguably what users expect from "starts with", but it is a behaviour change. Turbopuffer's `ContainsAllTokens` with `last_as_prefix` can reproduce the old behaviour if we need it.

### Field shapes

- **Ref fields** filter on the ref's `entryId` / `modelId` subfields (`packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchFilter/fields/RefFilter.ts`). There are no joins, so these become flat attributes.
- **Object fields** flatten to dot paths, recursively (`.../fields/ObjectFilter.ts`). OpenSearch indexes them as plain objects, not `nested`, so lists of objects already have "any element matches" semantics. Flattening into array attributes per subfield in turbopuffer or Lance gives the same result.
- **Latest and published** revisions are separate documents tagged by `__type` (`packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/initialQuery.ts:67`). This maps to two documents per entry, or a `__type` attribute in the same namespace.
- In shared mode every query adds `tenant` and `modelId` filters (`initialQuery.ts`). A namespace per tenant+model makes both unnecessary.

### Sorting, paging, counts

- Sort by any field, ASC or DESC. The default is `id.keyword` ascending (`.../CmsEntryOpenSearchBodyBuilder/sort.ts:56`). Turbopuffer `rank_by` takes up to 8 keys, which covers the sort plus `id` as a tie-breaker. Lance has `orderBy` with multiple columns.
- Paging uses `search_after` with `size: limit + 1` to detect more pages (`CmsEntryOpenSearchBodyBuilder.ts:123`). Neither engine has `search_after`. Both work with a filter cursor: `sortField < last OR (sortField = last AND id < lastId)`. That's what the Lance benchmark's "cursor page" query does. Turbopuffer caps `limit + offset` at 10k, so offset paging is out anyway.
- Every list sets `track_total_hits: true` (`CmsEntryOpenSearchBodyBuilder.ts:124`), so `meta.totalCount` is exact. Turbopuffer's `aggregate_by: Count` can't be combined with `rank_by` in one query, so each list needs a second query. The two can go in one multi-query request, but that needs checking. Lance has `countRows(filter)` as a separate call.

### Full-text search

The default `search` argument runs `query_string` with `*term*`, `allow_leading_wildcard`, `lenient` and `default_operator: and` across every searchable field (`packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/fullTextSearch.ts:16`). That's an infix wildcard, not relevance search.

- Turbopuffer: either `IGlob` per searchable field ORed together (same behaviour as today, needs the `glob` schema flag, and is expensive on big namespaces), or BM25 with `last_as_prefix` (real relevance ranking, but different results).
- Lance: `fullTextSearch` needs an FTS index first. Without one it errors (seen in the benchmark). `ILIKE` across fields reproduces today's behaviour.

### Aggregations

Only one: `getUniqueFieldValues` runs a `terms` aggregation with `size: 1000000` (`packages/api-headless-cms-ddb-es/src/operations/entry/DdbEsGetUniqueFieldValues.ts:69`). Turbopuffer `group_by` returns up to 10k groups. That's enough for anything a UI shows, but it is a lower limit. I found no group-by in Lance's Node query builder, so this would be a column scan.

### Extension points that leak OpenSearch DSL

`CmsEntryOpenSearchBodyModifier`, `CmsEntryOpenSearchSortModifier`, `CmsEntryOpenSearchQueryModifier` and `CmsEntryOpenSearchFullTextSearch` hand raw OpenSearch DSL to user code. None of it ports. A second engine needs an engine-neutral query tree that these hooks operate on. Projects with custom extensions on these hooks would have to rewrite them, so this is the part of the move that breaks things for users.

### Limits that matter

| Turbopuffer limit                         | Value                  | Impact                                                         |
| ----------------------------------------- | ---------------------- | -------------------------------------------------------------- |
| Attribute names per namespace             | 1,024                  | Fine per tenant+model; trivial with field flags                |
| Filterable value size                     | 4 KiB                  | Long text fields can't be filterable; flags make this explicit |
| `limit + offset`                          | < 10k                  | Cursor paging only                                             |
| Aggregation groups                        | 10k                    | Unique values capped at 10k                                    |
| Concurrent queries per unpinned namespace | 16                     | Fine per tenant; watch heavy tenants                           |
| Namespaces                                | Unlimited (250M+ seen) | Not a concern                                                  |

Regions include `aws-eu-central-1`. The Launch plan includes a SOC 2 report and a GDPR DPA. BYOC and single-tenancy are Enterprise only.

## LanceDB benchmark

LanceDB 0.40.0, Node SDK. One table shaped like a CMS model (status, latest, deleted, folder, title, price, date, tags, body), written the way the DynamoDB stream handler would: one upsert per entry, then 10% of entries saved again. The script is `saas-search-engine-spike/bench.mjs`, and `handler.mjs` wraps it for Lambda.

### Packaging

The `linux-arm64-gnu` native binary is 413 MB, and 272 MB after `objcopy --strip-all`. Lambda's zip limit is 250 MB unzipped, so LanceDB only runs as a container-image Lambda. Webiny ships zip Lambdas today, so this changes the deploy pipeline. The image was 1.28 GB.

### Writes and fragments

|                                 | Local disk (M-series Mac) | EC2 t4g.large → S3 | Lambda arm64 1769 MB → S3 |
| ------------------------------- | ------------------------- | ------------------ | ------------------------- |
| Single upsert p50 / p95         | 31 / 79 ms                | 140 / 168 ms       | 143 / 182 ms              |
| Fragments after N single writes | N (2000)                  | N (300)            | N (300)                   |
| Compaction (`optimize`)         | 6.6 s for 2000            | 1.6 s for 300      | 2.3 s for 300             |
| Creating 6 indexes              | 87 ms                     | 0.8 to 1.0 s       | 0.9 s                     |

Every write adds a fragment and a table version. Without compaction, reads slow down with each write, so compacting every table is a required background job, not an optimisation.

### Queries, p50

| Query                    | Uncompacted, 300 fragments (S3) | Compacted + indexed (S3) | 100 writes after indexing (S3) |
| ------------------------ | ------------------------------- | ------------------------ | ------------------------------ |
| filter + sort + limit 50 | 109 to 149 ms                   | 51 to 55 ms              | 75 to 81 ms                    |
| cursor page              | 103 to 133 ms                   | 50 to 52 ms              | 83 to 88 ms                    |
| contains (`LIKE '%x%'`)  | 88 to 120 ms                    | 49 to 51 ms              | 53 to 64 ms                    |
| range + in               | 88 to 120 ms                    | 27 to 28 ms              | 71 to 82 ms                    |
| tags any                 | 118 to 158 ms                   | 26 to 29 ms              | 25 to 29 ms                    |
| count                    | 40 to 64 ms                     | 24 to 28 ms              | 34 to 35 ms                    |
| full-text                | error without index             | 26 to 29 ms              | 37 to 51 ms                    |

On local disk the same compacted queries take 1 to 2 ms, so the 25 to 55 ms floor on S3 is S3 round trips. LanceDB OSS has no cache across queries. A "warm" Lambda only saves the module load and the connection.

Sanity checks passed on every run: the sorted, filtered results came back in descending date order with only published, non-deleted rows, and full-text returned hits after indexing.

### Cold Lambda

A 5,000-row compacted, indexed table on S3, queried from fresh containers (forced by changing an env var between invocations):

|                             | Container 1 | Container 2 | Container 3 | Warm        |
| --------------------------- | ----------- | ----------- | ----------- | ----------- |
| Init duration               | 681 ms      | 839 ms      | 569 ms      | n/a         |
| Module load                 | 312 ms      | 654 ms      | 308 ms      | n/a         |
| Connect + open table        | 311 ms      | 362 ms      | 276 ms      | 82 ms       |
| First query (filter + sort) | 834 ms      | 327 ms      | 1,071 ms    | 215 ms      |
| Repeat queries              | 25 to 62 ms | 23 to 61 ms | 26 to 60 ms | 25 to 62 ms |
| **Whole request**           | **2.6 s**   | **2.1 s**   | **2.5 s**   | **0.87 s**  |

The first invocation after a deploy had a 3.5 s init while Lambda pulled the image.

With thousands of tenants, most search Lambdas are cold for most tenants. Provisioned concurrency removes the init time but not the S3 reads.

## Comparison for SaaS

|                      | OpenSearch (shared + slot mapping)      | turbopuffer                                       | LanceDB embedded                                     |
| -------------------- | --------------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| Per-tenant models    | Needs a slot-mapping layer              | Native                                            | Native                                               |
| Tenant isolation     | Shared indexes, noisy neighbours        | Namespace per tenant+model                        | Table per tenant+model                               |
| Cost of idle tenants | Paid by an always-on cluster            | Close to zero                                     | Close to zero                                        |
| Ops on our side      | Cluster upgrades, shards, reindexing    | None                                              | Compaction, index upkeep, caching, container Lambdas |
| Cold query           | Same as warm                            | Unmeasured, has a cache tier                      | 2.1 to 2.6 s per request                             |
| Query features       | Richest                                 | Covers today's CMS, with the semantic notes above | Covers today's CMS; no group-by                      |
| Deleting a tenant    | `delete_by_query` across shared indexes | Delete namespaces                                 | Delete S3 prefixes                                   |
| Vendor               | AWS                                     | New sub-processor (DPA, EU region)                | None                                                 |

## Next steps

1. Get a turbopuffer API key and run the same benchmark (single upserts, compacted vs fresh namespace, cold namespace first query, count via multi-query). Port `bench.mjs`.
2. Design field-level index flags (filterable, sortable, searchable) in the model builder and admin UI, with a cap per model, and validate `where` / `sort` against them.
3. Define an engine-neutral query tree for the CMS list path and move the four DSL-based extension points onto it.
4. Decide the two semantic changes: `startsWith` matching at the start of the string, and `search` using BM25 or keeping infix globs.
5. Build `ddb+tpuf` CMS entry storage behind the existing storage operations, with sync based on `api-sync-ddb-to-opensearch`.

## Reproducing

- Local: `npm i @lancedb/lancedb@0.40.0 apache-arrow`, then `node bench.mjs ./data 2000`.
- Lambda: build `saas-search-engine-spike/Dockerfile` for `linux/arm64` from that folder (it needs a `package.json` with `"type": "module"`, `@lancedb/lancedb@0.40.0` and `apache-arrow`), push to ECR, create an arm64 image function with S3 access, and invoke it with `{"mode":"setup","uri":"s3://<bucket>/kept","rows":5000}`, then `{"mode":"query","uri":"s3://<bucket>/kept"}` and `{"mode":"bench","uri":"s3://<bucket>/bench","writes":300}`.

All AWS resources used for these runs were temporary and have been deleted.
