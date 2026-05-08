# 09 — Storage-Ops Status

A living checklist of remaining work in the SQLite storage-operations
packages. Updated as items land — flip `- [ ]` to `- [x]` when an item
ships (with a brief note linking to the commit / PR that closed it).

The intent is full parity with the DDB / DDB-ES storage operations on
every code path the container POC actually exercises. Genuinely
out-of-scope items (DDB streams CDC, OpenSearch-only features) are
noted at the bottom.

## Status legend

- `[ ]` — open. Throws `NOT_IMPLEMENTED`, returns an empty stub, or
  silently no-ops on the relevant code path.
- `[~]` — partial. Implemented for the common case; known gaps documented.
- `[x]` — done. Behavior at parity with DDB for the relevant calls;
  smoke-tested against the running container.

## CMS — entry storage operations

`packages/api-headless-cms-sqlite/src/operations/entry/index.ts`.

Already shipped (kept here for completeness):

- [x] `create`, `update`, `delete`, `deleteRevision` — three-row layout
  (R#/L/P), FTS shadow keyed to L. Shipped in
  [9a14415101](https://github.com/webiny/webiny-js/commit/9a14415101).
- [x] Revision lifecycle — `publish`, `unpublish`, `createRevisionFrom`,
  `getRevisions`, `getRevisionById`, `getPreviousRevision`,
  `getLatestRevisionByEntryId`, `getPublishedRevisionByEntryId`,
  `getPublishedByIds`. Shipped in
  [9a14415101](https://github.com/webiny/webiny-js/commit/9a14415101).
- [x] `list` — sk-prefix-filtered partition scan with the operator set
  below. Honors `where.latest` / `where.published` flags via pointer
  prefix.

Closed in this session:

- [x] **`move(model, id, folderId)`** — walks every row in the entry's
  partition (R# / L / P) and rewrites `location.folderId` on each.
- [x] **`moveToBin(model, params)`** — soft delete: sets `wbyDeleted=true`
  plus the deleted-* meta fields, `binOriginalFolderId`, and rewrites
  `location` across all rows. Verified end-to-end: entry shows up in
  `listDeletedArticles` after the call.
- [x] **`restoreFromBin(model, params)`** — inverse of `moveToBin`;
  picks the restored-* meta fields and clears the bin state.
- [x] **`deleteMultipleEntries(model, params)`** — bulk-delete by id
  list. Wraps the per-entry row wipes (R# / L / P / FTS shadow) in
  a single sqlite transaction.
- [x] **`getUniqueFieldValues(model, params)`** — list-and-aggregate
  mirroring the DDB shape; sorted by count desc then value asc. Not
  exposed via GraphQL in the current schema build; reachable via
  `context.cms.getUniqueFieldValues(model, params)`.
- [x] **Filter DSL — added `between` + `not_between`** (the most
  impactful gap; CMS date-range queries use this). Full operator set
  is now: `eq` (no suffix), `not`, `in`, `not_in`, `contains`,
  `not_contains`, `startsWith`, `not_startsWith`, `endsWith`,
  `not_endsWith`, `gt`, `gte`, `lt`, `lte`, `between`, `not_between`.
  Unrecognized operator suffixes fail closed (return empty results)
  rather than fail open. DDB-ES also has `fuzzy` and `and_in` — no
  current consumer needs them; can be added when one shows up.

## CMS — model + group storage operations

`packages/api-headless-cms-sqlite/src/operations/{model,group}/index.ts`.

- [x] Full CRUD for content models and content-model-groups, plus
  `listModels` / `listGroups` filtered by tenant + locale. No known gaps.

## API core — tenancy / security / users / key-value

`packages/api-core-sqlite/src/`.

- [x] Tenancy CRUD, security roles + teams CRUD, admin-users CRUD,
  key-value-store CRUD. No known gaps for the POC's auth + bootstrap
  flow.

## ACO

`packages/api-aco-sqlite/src/`.

- [x] Folder + filter-link-permissions + tags storage operations.
  Verified end-to-end against the Admin UI's folder tree.

## Audit logs

`packages/api-audit-logs-sqlite/src/`.

- [~] **`list` does scan-and-filter inside one partition.** Loads every
  audit-log row for the tenant, then runs the per-app/entity/action/
  createdBy/date filters in memory before paginating. Acceptable for
  POC volumes; production scale would need additional GSI columns +
  proper indexes added to `db-sqlite`. Documented in the developer
  guide.

## File manager

`packages/api-file-manager-fs/src/` (file bytes) +
`packages/api-headless-cms-sqlite/` (file metadata via the CMS model
the file-manager package registers).

- [x] Pre-signed POST + upload + download routes. Hot path verified
  via the Admin UI's File Manager.
- [~] `createFileManagerFs.ts` header notes that several FileStorage
  methods that the FS driver doesn't currently exercise are absent.
  No known consumer in the container POC hits them; revisit when the
  actual code path appears.

## Database layer

`packages/db-sqlite/src/`.

- [x] Single-table schema + FTS shadow + per-tenant GSI. Drizzle ORM,
  optimistic-concurrency `version` column. No known gaps for the data
  shapes used by the storage-ops packages above.
- [ ] **Schema-level indexes for high-cardinality scans.** Audit-logs is
  the obvious case; if any other entity ever needs the same, extra
  indexes get added here. Track when a new consumer needs it.

## Container-only kludges

`extensions/api/src/inMemoryDb.ts`.

- [~] **`context.db` backed by an in-process `Map`.** Exists only to
  keep `isBeingDeleted` from throwing on freshly-created models —
  api-headless-cms-tasks's `deleteModel` flow expects a `context.db`
  store but the container doesn't actually run that background task
  yet. Goes away when either (a) `deleteModel` runs on SQLite via a
  proper `IStore` impl, or (b) the container explicitly stubs out the
  task. Not urgent — current usage is bootstrap-only and Map-backed
  state is fine for one process.

## Out of scope (will not be implemented for the SQLite/Postgres path)

These belong on the container path's permanent OOS list — see
`06-out-of-scope.md`.

- **`api-sync-system`** — DynamoDB-streams CDC only. The container
  path uses SQLite FTS5 in-process for search updates (synchronous
  with the row write) and PostgreSQL will use the same write-side
  approach with its own search story. There is no streams-shaped
  problem to solve here. Stubbed in container mode; never gets a
  SQLite implementation. (See `06-out-of-scope.md` OOS-1.)
- **`api-dynamodb-to-elasticsearch`** — same reason; CDC pipeline
  for OpenSearch index updates. Container mode doesn't run OpenSearch.
- **`api-elasticsearch` / `api-elasticsearch-tasks`** — OpenSearch
  client + admin tasks. Not part of the container path's storage
  layer.
