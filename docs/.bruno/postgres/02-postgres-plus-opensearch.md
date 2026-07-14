# Headless CMS Storage Operations: Postgres + OpenSearch

## Overview

Use Postgres as the primary data store (table-per-model) and OpenSearch as the search/filtering engine. Same dual-write architecture as current DDB-ES, but replacing DynamoDB with Postgres.

**Target scale:** Tens of millions of records per model.

## Architecture

```
Write path:  App -> Postgres (source of truth) -> CDC/trigger -> OpenSearch (search index)
Read by ID:  App -> Postgres (direct)
List/filter: App -> OpenSearch (query) -> return results directly (or hydrate from PG if needed)
```

### Why This Approach

The current DDB-ES architecture exists for a reason: DynamoDB handles CRUD and point lookups, OpenSearch handles filtering/sorting/search. The dynamic nature of CMS models (nested objects, dynamic zones, arbitrary field types at any depth) maps naturally to OpenSearch's schemaless inverted index.

Postgres replaces DynamoDB in this architecture. OpenSearch remains for what it does best: arbitrary-depth field queries at scale.

## Postgres: Table-Per-Model (Source of Truth)

Same table structure as the pure Postgres approach:

```sql
CREATE TABLE webiny_cms_{modelId} (
    -- System columns
    id              TEXT        PRIMARY KEY,
    entry_id        TEXT        NOT NULL,
    version         INTEGER     NOT NULL,
    is_latest       BOOLEAN     NOT NULL DEFAULT false,
    is_published    BOOLEAN     NOT NULL DEFAULT false,
    locked          BOOLEAN     NOT NULL DEFAULT false,
    status          TEXT        NOT NULL DEFAULT 'draft',
    tenant          TEXT        NOT NULL,
    locale          TEXT        NOT NULL,
    location_folder_id TEXT,
    created_on      TIMESTAMPTZ NOT NULL DEFAULT now(),
    modified_on     TIMESTAMPTZ,
    saved_on        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_on      TIMESTAMPTZ,
    first_published_on TIMESTAMPTZ,
    last_published_on  TIMESTAMPTZ,
    created_by      JSONB       NOT NULL,
    modified_by     JSONB,
    saved_by        JSONB       NOT NULL,
    deleted_by      JSONB,
    wby_deleted     BOOLEAN     NOT NULL DEFAULT false,
    revision_description TEXT,
    
    -- User-defined field columns (same mapping as pure PG approach)
    -- text -> TEXT, number -> DOUBLE PRECISION, object -> JSONB, etc.
);
```

### Postgres Indexes (Minimal)

Since OpenSearch handles filtering/sorting/search, Postgres only needs indexes for point lookups:

```sql
-- Point lookups (get by ID, get latest, get published)
CREATE INDEX idx_{modelId}_latest 
    ON webiny_cms_{modelId} (tenant, locale, entry_id) 
    WHERE is_latest = true;

CREATE INDEX idx_{modelId}_published 
    ON webiny_cms_{modelId} (tenant, locale, entry_id) 
    WHERE is_published = true;

-- Revisions
CREATE INDEX idx_{modelId}_revisions 
    ON webiny_cms_{modelId} (tenant, locale, entry_id, version);
```

**No field-level indexes needed.** OpenSearch handles all filtering. This means:
- Minimal write amplification (3-5 indexes vs 30-50 in pure PG).
- Much faster writes.
- Much less storage for indexes.

## OpenSearch: Search Index

### Index Per Model

Same pattern as current DDB-ES:

```
{tenant}-headless-cms-{modelId}-v{schemaVersion}
```

An alias `{tenant}-headless-cms-{modelId}` points to the current versioned index. On schema evolution (field type changes), create new versioned index, re-index, swap alias (see Schema Lifecycle section below).

### Document Structure

Each entry is indexed as a flat/nested document. OpenSearch automatically indexes every field at every depth:

```json
{
    "id": "abc123#0001",
    "entryId": "abc123",
    "tenant": "t1",
    "locale": "en-US",
    "status": "draft",
    "version": 1,
    "isLatest": true,
    "isPublished": false,
    "createdOn": "2024-06-15T10:00:00Z",
    "createdBy": { "id": "user1", "displayName": "John" },
    "values": {
        "title": "My Article",
        "price": 99.99,
        "metadata": {
            "seo": {
                "score": 85,
                "keywords": ["postgres", "cms"]
            }
        },
        "content": [
            {
                "_templateId": "hero",
                "heading": "Welcome",
                "image": "file-id-123"
            },
            {
                "_templateId": "stats",
                "items": [
                    { "label": "Users", "value": 1000 }
                ]
            }
        ]
    },
    "__type": "cms.entry.l"
}
```

### What OpenSearch Gives Us (That Pure PG Struggles With)

1. **Arbitrary depth querying:** Filter on `values.metadata.seo.score > 80` — no per-path index needed. OpenSearch indexes every path automatically.

2. **Dynamic zone querying:** OpenSearch indexes dynamic zone content at any depth. Currently not exposed in Webiny's GraphQL API — enabling it requires GraphQL schema changes + OpenSearch query builder implementation. The storage/indexing layer already supports it.

3. **Full-text search:** Built-in analyzers, stemming, relevance scoring, field boosting, synonyms, "did you mean" suggestions.

4. **Aggregations:** `getUniqueFieldValues()` is a native `terms` aggregation. No need to scan all rows.

5. **Sort on any field at any depth:** No per-path expression indexes needed.

6. **Scale:** OpenSearch is designed for exactly this — filtering/sorting/searching millions of documents with dynamic schemas.

## Data Sync: Postgres -> OpenSearch

### How It Works Today (DDB-ES)

The current architecture does NOT write directly to OpenSearch from the application:

```
App -> DDB Primary Table (source of truth)
App -> DDB ES Table (staging table with index-ready data)
        |
        v
DDB Stream -> Lambda -> OpenSearch
```

The DDB ES table is a dedicated staging table. A DynamoDB Stream triggers a Lambda function on every write to this table, which then pushes the data to OpenSearch. This decouples the application from OpenSearch availability and provides automatic retries via DDB Streams.

### Postgres Equivalent

Postgres doesn't have DDB Streams, so we need an alternative mechanism for the async sync pipeline.

### Option A: Sync Table + Polling Worker

Mirror the DDB-ES pattern — a dedicated Postgres "sync table" that stages changes:

```sql
CREATE TABLE webiny_cms_os_sync_queue (
    id              BIGSERIAL   PRIMARY KEY,
    model_id        TEXT        NOT NULL,
    entry_id        TEXT        NOT NULL,
    operation       TEXT        NOT NULL,  -- 'index' | 'delete'
    os_index        TEXT        NOT NULL,  -- target OpenSearch index name
    data            JSONB,                 -- index-ready entry data (compressed/transformed)
    created_on      TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed       BOOLEAN     NOT NULL DEFAULT false,
    retry_count     INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX idx_sync_queue_pending 
    ON webiny_cms_os_sync_queue (created_on) 
    WHERE processed = false;
```

Write path:
```
App -> INSERT into model table (source of truth)
App -> INSERT into sync queue table (index-ready data)
        |
        v
Worker (cron/long-running) polls queue -> OpenSearch
Worker marks rows as processed
Worker deletes old processed rows periodically
```

**Pros:** Closest to current DDB-ES pattern. Reliable (data persisted in PG). Retryable. No external infrastructure beyond the worker process.
**Cons:** Polling latency (configurable — 100ms to seconds). Worker must be always running.

### Option B: Sync Table + LISTEN/NOTIFY for Low Latency

Same sync table as Option A, but use Postgres NOTIFY to wake the worker immediately:

```sql
CREATE OR REPLACE FUNCTION notify_sync_queue() RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('cms_os_sync', NEW.id::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_queue_notify
    AFTER INSERT ON webiny_cms_os_sync_queue
    FOR EACH ROW EXECUTE FUNCTION notify_sync_queue();
```

Worker uses `LISTEN cms_os_sync` to receive instant notifications. Falls back to polling if NOTIFY is missed (NOTIFY is not persistent — lost if no listener is connected).

**Pros:** Near-instant sync (<50ms). Still has sync table as reliable fallback.
**Cons:** Requires persistent connection for LISTEN. In serverless (Lambda) environments, LISTEN doesn't work — falls back to polling.

### Option C: CDC via Postgres Logical Replication

Use Postgres WAL (Write-Ahead Log) as the change stream:

```
App -> Postgres model tables -> WAL -> Debezium -> OpenSearch
```

Debezium reads the Postgres WAL and pushes changes to OpenSearch (or via Kafka/SQS intermediary).

**Pros:** No sync table needed. No application-level sync code. Postgres WAL is the "DDB Stream equivalent."
**Cons:** Requires Debezium (Java, heavy). Debezium Server can run standalone and push directly to OpenSearch or lightweight queues — Kafka is optional (needed only for multi-consumer fanout). Still significant infrastructure overhead. Entry data in WAL is raw row data — needs transformation to index-ready format somewhere in the pipeline.

### Option D: Application Queue (SQS/Redis)

```
App -> INSERT into Postgres
App -> Push message to SQS/Redis queue
        |
        v
Worker consumes queue -> OpenSearch
```

**Pros:** Well-understood pattern. SQS provides at-least-once delivery. Redis is fast.
**Cons:** Adds external dependency (SQS or Redis). If queue push fails after PG write, data is inconsistent. Two-phase commit problem.

Note on Option C: Debezium Server can run standalone and push directly to OpenSearch HTTP endpoint or lightweight queues (RabbitMQ). Kafka is only needed for multi-consumer fanout, which is not required here.

### Option E: Postgres WAL Logical Replication (Recommended)

The closest equivalent to DDB Streams. Postgres writes every change to WAL (Write-Ahead Log) for crash recovery — logical replication decodes WAL into row-level change events.

```
App -> INSERT/UPDATE/DELETE into model table
        |
        WAL (automatic, always written)
        |
        v
Logical Replication Slot -> Node.js Worker (long-running) -> Transform -> OpenSearch
```

**How it works:**
1. Enable logical replication in `postgresql.conf`: `wal_level = logical`
2. Create a replication slot: `SELECT pg_create_logical_replication_slot('cms_os_sync', 'pgoutput');`
3. Create a publication for CMS tables: `CREATE PUBLICATION cms_entries FOR TABLE webiny_cms_article, webiny_cms_product, ...;`
4. Long-running Node.js worker connects as replication client, receives stream of changes.
5. Worker transforms row data to index-ready format, pushes to OpenSearch.
6. Replication slot tracks consumer position — no data loss even if worker restarts.

**Logical decoding plugins:**
- **`pgoutput`** — built-in (Postgres 10+), standard protocol. Recommended.
- **`wal2json`** — outputs changes as JSON. Easier to parse but external plugin.

**Node.js consumption:**
- `pg` (node-postgres) supports logical replication protocol directly.
- `pg-logical-replication` library wraps it for convenience.

**Why this is the right choice:**

| Property | DDB Streams | PG WAL Logical Replication |
|----------|-------------|---------------------------|
| Persistent | Yes | Yes (replication slot retains WAL) |
| Ordered | Yes (per partition) | Yes (LSN-ordered) |
| Guaranteed delivery | Yes | Yes (slot tracks position) |
| Consumer tracks position | Shard iterator | Replication slot LSN |
| Automatic | Yes | Yes (WAL always written) |
| Needs external infra | No (built into DDB) | No (built into Postgres) |

**Transformation pipeline:**

The worker receives raw row data from WAL. It must transform to index-ready format before pushing to OpenSearch:

1. Receive change event (INSERT/UPDATE/DELETE + full row data).
2. Determine model from table name (`webiny_cms_{modelId}` -> `modelId`).
3. Load model definition (field types, nesting structure).
4. Transform entry to OpenSearch document format:
   - System fields mapped directly.
   - Top-level scalar fields mapped directly.
   - JSONB fields (objects, dynamic zones) included as nested documents.
   - Split into `values` / `rawValues` based on field indexing config (same as current DDB-ES pattern).
5. Determine target OpenSearch index (`{tenant}-headless-cms-{modelId}`).
6. Index document (or delete on DELETE events).

**Publication management:**

When models are created/deleted, the publication must be updated:

```sql
-- Model created
ALTER PUBLICATION cms_entries ADD TABLE webiny_cms_new_model;

-- Model deleted
ALTER PUBLICATION cms_entries DROP TABLE webiny_cms_old_model;
```

`ALTER PUBLICATION` is instant, no lock on existing tables.

**Pros:**
- No sync table needed. No polling. WAL IS the queue.
- Persistent and guaranteed — replication slot retains WAL until consumed.
- Ordered — changes arrive in commit order.
- No application-level sync code in the write path — just write to Postgres normally.
- Built into Postgres, no external dependencies.
- Worker can batch changes for efficient OpenSearch bulk indexing.

**Cons:**
- Replication slot retains WAL segments until consumed — if worker is down for extended period, WAL disk usage grows. Mitigate with `max_slot_wal_keep_size` (Postgres 13+). **Warning:** if consumer lags beyond this boundary, WAL is truncated and slot becomes invalid — worker must fall back to full re-index.
- Row data in WAL is raw table columns — needs transformation to index-ready format in the worker.
- Requires long-running worker process. Fine for server-based deployments.
- Adding/removing tables from publication requires `ALTER PUBLICATION` on model create/delete.

**Worker reliability requirements:**

1. **Crash recovery / idempotency:** If worker crashes mid-batch, replication slot retains position. On restart, worker may re-process some changes. OpenSearch indexing is idempotent (PUT with same `_id` overwrites), so duplicate indexing is safe. Worker should commit replication slot position only after successful OpenSearch bulk write.

2. **Replication lag monitoring:** Monitor via `pg_stat_replication`. Alert if lag exceeds threshold (e.g., >5 minutes). Expose lag metric for observability.

3. **Reconnection:** If worker loses connection to Postgres, implement exponential backoff retry. Replication slot preserves position — no data loss on reconnect.

4. **Slot validity check:** On worker startup, verify slot is still valid. If slot was invalidated (WAL truncated), trigger full re-index from Postgres tables.

### Recommendation

**Option E (WAL Logical Replication)** — the direct Postgres equivalent of DDB Streams. No sync tables, no polling, no external infrastructure. Persistent, ordered, guaranteed delivery. The worker is a long-running Node.js process that consumes the replication stream, transforms entries, and pushes to OpenSearch.

For fallback/recovery, the worker should also support a "full re-index" mode that reads directly from Postgres model tables and bulk-indexes to OpenSearch (for initial setup, index corruption, or OpenSearch cluster replacement).

## Filtering / Sorting / Search

All handled by OpenSearch. Same query building as current DDB-ES implementation:

- `list()` builds an OpenSearch query body.
- Filters map to OpenSearch `bool` queries (`must`, `should`, `must_not`).
- Sort maps to OpenSearch `sort` clauses.
- Pagination uses `search_after` (cursor-based).
- Full-text search uses OpenSearch `match` / `multi_match` queries.
- Aggregations use OpenSearch `terms` / `cardinality` aggregations.

### Nested Field Queries

```json
{
    "query": {
        "bool": {
            "must": [
                { "range": { "values.metadata.seo.score": { "gt": 80 } } },
                { "match": { "values.content.heading": "Welcome" } }
            ]
        }
    },
    "sort": [
        { "values.metadata.seo.score": "desc" }
    ]
}
```

No special handling needed for objects — OpenSearch indexes all paths at any depth without per-path configuration. Dynamic zone filtering is not yet exposed in Webiny's GraphQL API but the data is already indexed in OpenSearch; enabling it requires GraphQL schema changes + OpenSearch query builder implementation for dynamic zone field types.

## Point Reads (Direct from Postgres)

For single-entry lookups by known ID, go directly to Postgres (no need for OpenSearch):

- `getRevisionById(id)` -> `SELECT * FROM webiny_cms_{modelId} WHERE id = $1`
- `getLatestRevisionByEntryId(entryId)` -> `SELECT * FROM webiny_cms_{modelId} WHERE entry_id = $1 AND is_latest = true`
- `getPublishedRevisionByEntryId(entryId)` -> `SELECT * FROM webiny_cms_{modelId} WHERE entry_id = $1 AND is_published = true`
- `getRevisions(entryId)` -> `SELECT * FROM webiny_cms_{modelId} WHERE entry_id = $1 ORDER BY version`

These use Postgres B-tree indexes. Sub-millisecond at any table size.

## Schema Lifecycle

Same as pure Postgres approach for DDL:

| Operation | DDL | Lock | Duration |
|-----------|-----|------|----------|
| Add field | `ALTER TABLE ADD COLUMN` | None (instant) | Instant |
| Remove field | `ALTER TABLE DROP COLUMN` | Brief | Instant |
| Change field type | `ALTER TABLE ALTER COLUMN TYPE` | ACCESS EXCLUSIVE | Minutes (30M rows) |
| Create model | `CREATE TABLE` + OpenSearch `PUT index` | None | Fast |
| Delete model | `DROP TABLE` + OpenSearch `DELETE index` | None | Instant |

When model schema changes:
1. DDL on Postgres table.
2. New fields: OpenSearch dynamic mapping auto-detects type on first indexed document. Use explicit index templates with strict type mappings to prevent type conflicts (e.g., field first indexed as string, later as number).
3. Field type changes: requires re-indexing. Strategy: create new index with updated mapping, bulk re-index from Postgres, swap alias to new index (zero-downtime).
4. Field removal: no OpenSearch action needed — unmapped fields are ignored in queries.

**OpenSearch index naming recommendation:** Version index names by schema hash or version counter (e.g., `t1-headless-cms-article-v3`) with aliases pointing to current version. This enables zero-downtime re-indexing on schema changes.

## Multi-Tenancy

Same options as pure Postgres:
- **Table prefix:** `webiny_t1_cms_article`
- **Postgres schemas:** `tenant_t1.webiny_cms_article`
- **OpenSearch index prefix:** `t1-headless-cms-article`

## Comparison with Pure Postgres

| Aspect | Pure Postgres | Postgres + OpenSearch |
|--------|--------------|----------------------|
| **Infrastructure** | Single database | Postgres + OpenSearch cluster |
| **Operational complexity** | Lower | Higher (two systems to manage) |
| **Cost** | Lower | Higher (OpenSearch infra) |
| **Top-level field filtering** | Fast (B-tree) | Fast (OpenSearch) |
| **Nested field filtering** | Needs per-path expression index | Automatic, any depth |
| **Dynamic zone querying** | Limited, hard to index | Data indexed natively; API filtering not yet exposed (requires GraphQL + query builder work) |
| **Sort on any field** | Needs per-path index | Automatic |
| **Full-text search quality** | Basic (tsvector) | Excellent (analyzers, relevance, fuzzy) |
| **Write performance** | 30-50 indexes = slow writes | 3-5 PG indexes + async OS index |
| **Index management** | Must build lifecycle manager | OpenSearch auto-manages |
| **Aggregations** | Full table scan or complex queries | Native terms/cardinality aggs |
| **Consistency** | Immediate | Eventual (dual write lag) |
| **Data recovery** | Single source | PG is source of truth, OS rebuildable |

## Risks and Concerns

### 1. OpenSearch Availability
- If OpenSearch is down, `list()` fails. Point reads still work via Postgres.
- Mitigation: OpenSearch cluster with replicas.

### 2. Dual Write Consistency
- Write to Postgres succeeds but OpenSearch fails = stale search results.
- Mitigation: retry queue, periodic full re-index job, health check endpoint.

### 3. Re-indexing at Scale
- Re-indexing 30M documents in OpenSearch: hours depending on cluster size.
- Needed on: OpenSearch cluster replacement, index mapping changes, data corruption.
- Mitigation: background re-index with zero-downtime alias swapping.

### 4. Infrastructure Cost
- OpenSearch cluster is not free: compute, storage, network.
- Managed OpenSearch (AWS) pricing is significant at scale.
- Self-hosted: operational burden.

### 5. Index Mapping Conflicts
- OpenSearch auto-detects field types on first index. If field types change, mapping conflicts occur.
- Mitigation: explicit index templates with dynamic mapping rules.

## Summary

| Aspect | Capability | Concern Level |
|--------|-----------|---------------|
| CRUD | Postgres native. Fast. | None |
| Top-level field filtering | OpenSearch. Fast. | None |
| Nested field filtering | OpenSearch. Automatic. | None |
| Dynamic zone querying | Data indexed in OS; API filtering not yet exposed. | Low (requires GraphQL + query builder work) |
| Full-text search | OpenSearch analyzers/relevance. | None |
| Fuzzy search | OpenSearch built-in. | None |
| Sort on any field | OpenSearch. Automatic. | None |
| Aggregations | OpenSearch native. | None |
| Write performance | Minimal PG indexes + async OS. | Low |
| Schema evolution | DDL instant + OS auto-mapping. | Low |
| Consistency | Dual write = eventual. | Medium |
| Infrastructure | Two systems to operate. | Medium |
| Cost | OpenSearch cluster cost. | Medium |
| Re-indexing | Hours at 30M rows. | Medium |
