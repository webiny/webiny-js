# Task 6 findings — summary

Full report: `file-references-validation.md` (§6.1–§6.9)

## The headline: Task 5's objection wasn't DynamoDB-specific

Task 5 rejected a private CMS model because list-filtering degrades to a full model scan on
DynamoDB-only. **Standalone SQL has the same defect — and in two respects worse.**
`api-headless-cms-sql/src/operations/entry/queryHelpers.ts:133` pushes only structural predicates
(`tenant`, `modelId`, `entryId`, `isPublished`/`isLatest`, `wbyDeleted`) into SQL, then:

```ts
const rows: IEntryRow[] = await qb;                              // ← no LIMIT
entry.values[field.fieldId] = await fromStorage(field, …);       // ← decompresses EVERY row
const filteredItems = filter<T>({ items: records, where, … });   // ← in JS
const sortedItems  = sort<T>({ … });                             // ← in JS
const slicedItems  = sortedItems.slice(start, start + limit);    // ← paginate afterwards
```

So a CMS-model reference index is **unindexed on both default backends**. The only configurations
where it's cheap are `ddb-es` and `pg-os`.

## Standalone: SQL via knex, and no migrations

Single long-running Node server, SQLite (`better-sqlite3`) or Postgres (`pg`), local file storage,
built-in auth. No Pulumi, no deploy.

**The divergence point is `createWebinyApiHandler`'s `registerRootStorage`** — three composition
roots (`api-event-handler-server-sql`, `-aws-ddb`, `-aws-ddb-os`), each registering backend-specific
storage Features. **The lowest layer with more than one implementation is the per-feature
storage-operations Feature.** There is no common DB abstraction beneath it — portability means
writing the concern twice, not an adapter.

**There is no migration system.** `TableManager.ensure()` is create-if-not-exists; zero matches for
`knex.migrate`/`alterTable`, no `migrations/` directory. **On upgrade against an existing local
database, nothing happens** — if the table exists the creator callback never runs, so a new column or
index has no effect. The schema is frozen at first creation.

## What is and isn't portable today

- **CMS entries:** real shared interface (22 per-operation abstractions), but **four full
  implementations** — `Ddb*` (27 files), `DdbEs*` (29), `Sql*` (26), `PgOs*` (18). Not a thin adapter.
- **KeyValueStore: already portable, zero extra work.** `api-core-ddb` and `api-core-sql` have
  identical directory structures; the SQL side is one `webiny_core_key_value` table. So the asset
  delivery metadata and FM settings from Tasks 3–4 already work on Standalone. But still no
  list/query/prefix-scan.
- **Every storage-owning feature is paired** (`-ddb` + `-sql`): api-core, ACO, audit-logs,
  websockets, background tasks. The only singletons are `self-hosted-auth-sql` (Standalone-only) and
  `api-background-tasks-os` (2024, predates the split).
- **The paired `-ddb`/`-sql` Feature package is the most recent pattern** — `api-core-ddb` and
  `api-core-sql` were introduced _on the same day_ (2026-07-02); `api-headless-cms-sql` and
  `-pg-os` are newest (2026-07-29).

## AWS table: you probably don't need a new GSI

One table `webiny`, `PK`/`SK`, TTL on `expiresAt`, **three GSIs** — `GSI_TENANT` (KEYS_ONLY),
`GSI1`, `GSI2` (both ALL). There is **no entity registration point** — it's convention:
`createTable({ name: process.env.DB_TABLE })` + `createGlobalEntity(...)`, then pick your own key
prefix.

**GSI1/GSI2 are already shared across features by prefix** (`api-aco-ddb` uses
`GSI2_PK: T#${tenant}#FLP`; audit-logs uses GSI2 too; CMS uses GSI1). A reference index just claims
`FILEREF#`.

If you _did_ add GSI3: Pulumi edit → `UpdateTable` → deployment required, and **nothing in the repo
backfills DynamoDB items into a new index**. The only reindex machinery is for OpenSearch
(`api-search-index-tasks/.../ReindexTask.ts`).

## Two negative results

- **No search index in Standalone.** `api-headless-cms-pg-os` exists and is complete-looking (it
  pushes list/get to OpenSearch via the same body builder as `ddb-es`), but **nothing outside the
  package references it** — no `server-sql-os` composition root, no template mention. It is built
  but not assembled.
- **No Cloudflare Workers target.** Four repo-wide hits, none a target: `site-capture` detecting
  Cloudflare bot-challenge pages, and `pg-cloudflare` listed as a transitive `pg` dependency to be
  pruned. No `wrangler.toml`, no D1, no worker entry point. Nothing constrains the storage choice on
  that axis today.

## Recommendation

**Follow the established paired-Feature pattern:** `ReferenceIndexStorageOperations` abstractions in
the feature package, one `-ddb` and one `-sql` implementation, both registered from the two
composition roots. Exactly what api-core, ACO, audit-logs and websockets do.

- **AWS cost: low.** No new GSI — reuse `GSI1` with a `FILEREF#` prefix. Both access patterns are
  single `Query` calls. No extra deployment, no backfill problem.
- **Standalone cost: moderate but bounded.** One knex table with real B-tree indexes on `fileId` and
  `sourceId`. Both patterns genuinely indexed — **this is where Standalone beats the CMS-model
  route**, because you control the schema instead of inheriting filter-in-JS. The constraint is the
  missing migration system: get the columns right first time.
- **Unavoidable:** written twice, and you own tenancy scoping and pagination by hand in both.

**If writing it twice isn't acceptable**, the fallback is a private CMS model _plus real mitigation_
— keep by-file-ID off the list path by maintaining a reverse index at `refs/file/{fileId}` in the
key-value store (already portable, O(1) on both backends, zero per-backend code), and use the CMS
model only as the durable record and for the by-source-ID query, which is naturally bounded to one
entry's references. That caps the KV 400 KB-per-key exposure at "references to a single file" and
avoids the unbounded scan entirely.

Pick the paired-package route if the index is first-class with unbounded cardinality; pick
KV-plus-CMS-model if avoiding per-backend code matters more and a per-file ceiling is acceptable.
