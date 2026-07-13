# CMS Content Storage Architecture Comparison

How other CMS systems solve the dynamic content storage problem, and their known limitations.

## Quick Comparison

| System | Storage Pattern | Nested Fields | Search Engine | Key Scaling Pain |
|--------|----------------|---------------|---------------|-----------------|
| **Strapi v5** | Table-per-type + join tables + morph tables | Separate tables + polymorphic morph | SQL only (Knex) | JOIN explosion >10 relations; table proliferation |
| **Payload CMS** | Table-per-collection + sub-tables for arrays/blocks | Flattened columns (groups), sub-tables (arrays/blocks) | SQL (Drizzle) | Deep population timeouts; `find()` overhead |
| **Contentful** | SaaS (undisclosed) | References (Links), max 50 fields | Managed | 50 field limit; 1000 result cap; rate limits |
| **TYPO3** | Table-per-type, columns per field | Real columns + IRRE relations | SQL | Row size limits on tt_content |
| **WordPress** | EAV (`wp_postmeta`) | Each field = separate meta row | SQL (self-JOINs) | Unusable past ~1M meta rows |
| **AEM** | JCR node tree (TarMK/MongoMK) | Hierarchical nodes | Lucene/Solr indexes | Max 1000 ordered child nodes; no ad-hoc queries |
| **Sanity** | NoSQL document store (Content Lake) | Nested JSON, max 20 levels | GROQ + CDN cache | 2000 attribute path limit per dataset |
| **Directus** | Table-per-collection, real columns | SQL foreign keys + junction tables | SQL native | No auto-created indexes; degrades >100K items without tuning |
| **Drupal** | Per-field tables (EAV-like) | Entity references + field tables | Solr/Elasticsearch (Search API) | Table proliferation; JOIN explosion |

## Detailed Analysis

### 1. Strapi v5

**Storage:** Table-per-content-type. Each content type = own SQL table. Every relation (even one-to-one) gets a dedicated join table (e.g., `articles_category_links`). Components stored in separate tables. Dynamic zones use polymorphic morph tables (`entity_attribute_morphs`). Strapi v5 introduced `documentId` (cuid2) where each logical document can have multiple rows (draft, published, per-locale).

**Databases:** PostgreSQL 14+, MySQL 8+, MariaDB 10.3+, SQLite 3. No MongoDB. Query engine built on Knex.js.

**Filtering/Search:** All filtering runs as SQL queries via Knex.js. No built-in Elasticsearch. Fetching nested relations in dynamic zones requires explicit per-component `populate` queries; default population only retrieves scalar fields.

**Limitations:**
- Query performance degrades when populate exceeds ~10 relations (JOIN complexity).
- High table count even for modest schemas (join table per relation, morph table per dynamic zone).
- Missing indexes on component/morph/localization tables cause slow queries.
- Localized content saves can take 7-10 seconds with ~40 entities x ~10 locales.

---

### 2. Payload CMS

**Storage:** Table-per-collection for relational databases (Postgres, SQLite). Each collection = primary table with columns per field. Nested/group fields flattened into underscore-separated column names (`myGroup.nestedField` becomes `my_group_nested_field`), transformed back to nested shape on read. MongoDB: single BSON document per entry.

**Arrays and Blocks:** Arrays get dedicated tables (`{collection}_{fieldname}`) with `_order` columns. Blocks create separate tables per unique block slug. A `blocksAsJSON` option stores blocks as JSON columns instead of normalized tables, trading queryability for performance. Relationships use a centralized `{collection}_rels` table.

**Databases:** MongoDB (Mongoose), PostgreSQL (Drizzle + node-postgres), SQLite (Drizzle).

**Limitations:**
- `payload.find` for 1,000 docs: ~4s vs ~600ms raw Mongoose (improved in v3.26.0).
- Deep `depth` population can cause circular relationship traversal and server timeouts.
- No documented hard limits on field count, nesting depth, or entry count.
- `blocksAsJSON` sacrifices ability to query block fields via SQL.

---

### 3. Contentful (SaaS)

**Storage:** Fully SaaS on AWS. No publicly documented database engine. Content organized into spaces with content types (schemas) and entries. API behavior (flat entries with link-based references, 1000-item result caps) suggests relational or search-index-backed store.

**Filtering/Search:** CDA supports operators: `ne`, `all`, `in`, `nin`, `exists`, `lt/lte/gt/gte`, `match`, `near`, `within`. Full-text search via `match`. Cannot filter on Object or RichText fields in GraphQL. Reference queries work only one level deep, max 2 searchable reference fields.

**Hard Limits:**
- **50 fields** per content type.
- Short text 256 chars, long text 50,000 chars, rich text 200,000 chars / 1MB.
- CDA: 55 req/s (free), 78 req/s (paid).
- CMA: 7 req/s (free), 10 req/s (paid).
- Max **1,000 entries** per query result (default 100).
- Query-time include depth capped at 10 levels.
- Cannot filter on Object or RichText fields in GraphQL.
- Reference search: one level deep only, max 2 searchable reference fields.
- No documented hard cap on total entries per space (plan-dependent).

---

### 4. TYPO3

**Storage:** Table-per-type with dedicated columns. Central content table is `tt_content` for all standard content elements. `pages` table provides hierarchical site tree. Extensions add custom content types by adding columns to `tt_content` (declared in `ext_tables.sql`). Custom record types get their own tables.

**Nested Fields:** IRRE (Inline Relational Record Editing) handles 1:n and m:n nested relations via FK and MM tables. Not a dynamic schema — fields are real database columns defined in PHP configuration (TCA).

**Databases:** MySQL, MariaDB, PostgreSQL, SQLite, Microsoft SQL Server.

**Limitations:**
- MySQL/MariaDB row size limit (65,535 bytes for non-BLOB columns). `tt_content` is vulnerable because extensions keep adding VARCHAR columns to it.
- High-offset pagination degrades performance at scale.
- Fields are not truly dynamic — require code deployment to add.

---

### 5. WordPress

**Storage:** Classic EAV via `wp_postmeta`. Four columns: `meta_id` (PK), `post_id` (FK), `meta_key` (varchar 255), `meta_value` (longtext). Every custom field = separate row. ACF, Meta Box, Pods all use same `wp_postmeta` table.

**Filtering/Search:** `WP_Query` `meta_query` generates INNER JOIN on `wp_postmeta` for each filter condition. 3 custom field filters = 3 self-joins against the same table. `meta_value` is longtext — cannot be effectively indexed.

**Databases:** MySQL 5.5.5+, MariaDB 10.0+. Experimental SQLite plugin.

**Scaling Reality:**
- Performance degrades past ~100,000 meta rows.
- 10,000 posts x 20 fields = 200,000+ meta rows.
- 100,000 posts x 10 fields (1M meta rows): filtering on 3 meta values = 3 self-joins on 1M row table.
- 250,000 posts x 40 fields (~10M meta rows): **standard queries unworkable**.
- WooCommerce solved this by introducing HPOS (High-Performance Order Storage) — dedicated flat tables.

---

### 6. Adobe Experience Manager (AEM)

**Storage:** JCR (Java Content Repository) via Apache Jackrabbit Oak. Content stored as hierarchical node tree (like filesystem). Each node has named properties (key-value pairs). No SQL tables.

**Underlying Persistence:**
- **TarMK** (Segment Tar): content as records in tar files. Single-instance optimized.
- **MongoMK**: MongoDB as persistence layer. Multi-instance scaling.
- Binary assets offloaded to S3/Azure Blob.

**Nested Fields:** Inherently hierarchical — components are child nodes of page nodes. No schema enforcement at repository level. Any node can have any properties.

**Search:** Apache Oak indexes (Lucene/Solr-based) built asynchronously from node tree. Query languages: JCR-SQL2 and XPath. Without proper index definitions, queries fall back to traversal, capped at 100K nodes.

**Limitations:**
- Max **1,000 ordered child nodes** per parent (recommended).
- Unordered nodes can scale to millions.
- 4-node MongoDB cluster: ~1.8x single TarMK throughput.
- 8-node cluster: ~2.3x. Diminishing returns.
- No ad-hoc relational queries — must pre-configure indexes.

---

### 7. Sanity

**Storage:** Proprietary NoSQL document store ("Content Lake") on Google Cloud. Every piece of content = JSON document. No collections/tables — all documents in flat pool, differentiated by `_type` field. No schema enforcement at storage level.

**Nested Fields:** Nested JSON objects/arrays within document. Portable Text (rich text) = deeply nested JSON block arrays. References use `_ref` field with target document ID. GROQ resolves cross-document joins at query time.

**Search:** GROQ (Graph-Relational Object Queries) primary query language. Supports filtering, projections, joins via references, ordering. Secondary GraphQL API. Full-text search via dedicated endpoint. CDN caching for read-heavy workloads.

**Hard Limits:**
- **20 levels** max nesting depth within document.
- **2,000 unique attribute paths** per dataset (Free), **10,000** (Growth). Each distinct JSON path counts.
- **1,000 attributes per document** (Free/Growth), **8,000** (Enterprise).
- **32 MB** max document size.
- **10M documents** or **10 GB** total JSON per dataset.
- Query timeout: 1 minute. Working set per query: 500 MB.
- Mutation rate: 25 req/s per IP. Concurrent queries: 500 max.
- Deeply nested block content with custom objects rapidly consumes attribute budget.

---

### 8. Directus

**Storage:** Pure SQL database wrapper. Each collection = real database table. Each field = real database column with native type. Creating a collection in Directus literally creates a SQL table. **True table-per-collection with real columns.**

**Databases:** PostgreSQL 10+, MySQL 5.7+, MariaDB 10.2+, SQLite 3, MS SQL Server, CockroachDB, OracleDB. PostgreSQL recommended for production.

**Nested Fields:** Standard SQL foreign keys and junction tables. M2O = FK column on child. M2M = junction table. Nested relational data fetched via dot-notation in API (`?fields=author.name`), resolved through SQL JOINs.

**Search:** Filtering translated to SQL WHERE clauses. Full power of underlying database query optimizer. Full-text search depends on database engine (e.g., Postgres tsvector).

**Limitations:**
- Directus does **not auto-create indexes** for foreign keys.
- Search uses `LOWER(column) LIKE '%term%'` with OR across all text fields — prevents index usage, forces full table scans.
- At **~100K rows**, search takes seconds to minutes.
- At **~6M files**, sorting/count queries went from 30ms to **30 seconds**.
- Collection with 15 relations averaged **1.5s per request** at just 10 req/s.
- No multi-schema database support.
- No native complex field types (no dynamic zones, no blocks). Nesting is purely relational.

---

### 9. Drupal

**Storage:** Per-field table storage (EAV-like). Each entity type has a base table with core columns. **Each field added to an entity type gets two dedicated tables:** one for current values (`node__field_name`) and one for revision history (`node_revision__field_name`). Multi-value fields store one row per value with `delta` column for ordering.

**Nested Fields:** Entity references stored as FK values in field tables. Paragraph module and Layout Builder enable deeply nested content via chains of entity references — each paragraph is its own entity with its own field tables.

**Search:** Entity Query API generates SQL queries across normalized field tables. For production: **almost universally uses Search API with Solr or Elasticsearch** rather than SQL. Search API indexes denormalized content into search engine, bypassing EAV JOIN problem.

**Scaling Reality:**
- 20 fields per content type = **40+ field tables** (data + revision per field).
- Query filtering on one field + sorting on another = JOIN across multiple field tables.
- MySQL enforces **61-table JOIN limit** — entities with 60+ fields trigger SQL error.
- On datasets of **1.5-2M entities**, unnecessary self-JOINs caused queries to take **10-25 seconds**.
- Sites with hundreds of content types: **thousands of tables**.
- Paragraph nesting compounds this — each paragraph level = its own entity + field tables + JOINs.
- SQL-only search is a known performance bottleneck — **Solr/ES effectively required for production**.

## Key Takeaways for Webiny Postgres Implementation

1. **No CMS solves unlimited dynamic nesting with pure SQL at scale (based on industry patterns).** Systems that support schemaless dynamic content (Strapi dynamic zones, Drupal Paragraphs, AEM components, Sanity) either use a document store or add a dedicated search engine at production scale. Systems like Directus and TYPO3 avoid the problem by design — they use structured schemas with fixed fields, not dynamic zones.

2. **Table-per-model is the dominant relational pattern.** Strapi, Payload, TYPO3, Directus all use it. WordPress's EAV is universally regarded as its biggest scaling problem.

3. **Dynamic zones / blocks are the hardest part.** Strapi uses morph tables (complex). Payload uses sub-tables or JSON columns (trade-off). Contentful limits to 50 fields. Sanity limits to 2000 attribute paths. Nobody has a clean solution that is both fully queryable AND fully dynamic.

4. **At tens of millions of rows, no surveyed CMS uses pure SQL for filtering on deeply nested dynamic content.** Systems at that scale add a search engine. Drupal's ecosystem assumes Solr/ES for production search. AEM requires pre-configured Lucene indexes. Directus degrades at ~100K rows with its `LIKE`-based search. No public case studies of pure-SQL CMS succeeding at 30M+ rows with dynamic schemas were found — this is an absence of evidence, not proof of impossibility, but the industry pattern is clear.

5. **Webiny's current DDB-ES architecture is the right pattern** — just replace DDB with Postgres as source of truth, keep OpenSearch for querying. This is what Drupal effectively does (SQL for storage, Solr/ES for search), and it's the industry-proven approach for dynamic CMS at scale.

6. **Choosing between approaches:** Pure Postgres (Doc 01) is viable for models with limited nesting and moderate scale (<10M rows). For Webiny's full feature set (dynamic zones, unlimited nesting, tens of millions of rows), Postgres + OpenSearch (Doc 02) is the recommended path — it mirrors the proven DDB-ES pattern while replacing the AWS-specific storage layer.
