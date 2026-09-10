# Simple content entries — design

**Status:** proposed, for review
**Date:** 2026-09-10
**Scope:** base code only. No feature semantics, no UI, no activity-log functionality.
**Investigation base:** `next` at `270b8058d5`

## What this is

A parallel, reduced content-entry stack inside `@webiny/api-headless-cms`, living at
`src/features/simpleContentEntries/`.

A simple content entry is a normal CMS entry — same `CmsModel`, same storage operations, same table —
with the revision and publishing dimensions removed and the meta-field envelope cut to what is
actually needed.

The layering is unchanged from regular entries:

```
GraphQL  →  CRUD  →  features (use case → repository)  →  storage operations
                                                          ^ untouched, injected per backend
```

**Nothing in the `api-headless-cms-*` storage-operation packages changes.** No new keys, no new
entity, no new table, no per-backend work. That is the central constraint, and it is what makes the
required-field audit below the load-bearing part of this design.

**Deployment assumption.** A search backend is always present — `ddb-es` or `pg-os`. Reads are
answered there, so the DynamoDB-only read path is out of scope and the primary backend for both the
audit and the tests is the search-backed one.

## The five operations

`create`, `update`, `get`, `list`, `delete`.

Deliberately absent: `publish`, `unpublish`, `republish`, `createRevisionFrom`, `getRevisionById`,
`getRevisions`, `getLatestRevisionByEntryId`, `getPublishedRevisionByEntryId`,
`getPreviousRevision`, `moveToBin`, `restoreFromBin`, `updateRevisionDescription`, and the singleton
variants. `contentEntry/` has 29 slices today; this has five.

## The entry shape

You proposed: `id`, `entryId`, `tenant`, `modelId`, `createdOn`, `createdBy`, `values`.

That is right on intent but four fields short of what the unmodified storage operations read. The
audit follows; the conclusion is that the shape must be:

| Field | Why it is there |
| --- | --- |
| `id` | `createPartitionKey` runs `parseIdentifier(id)`, so it must stay `<entryId>#0001` |
| `entryId` | `DdbDeleteEntry` falls back to `entry.id \|\| entry.entryId` |
| `tenant` | every key builder; `dataLoaders.clearAll({ tenant })` |
| `modelId` | `createGSIPartitionKey` |
| `values` | the payload |
| `createdOn` | your requirement, not storage's |
| `createdBy` | your requirement, not storage's |
| **`version`** | **pinned to `1`** — feeds `createRevisionSortKey` → `REV#${zeroPad(version)}` |
| **`status`** | **pinned to `"draft"`** — create and update branch on `entry.status === "published"` |
| **`locked`** | **pinned to `false`** — create and update write it explicitly |
| **`expiresAt`** | **pinned to `null`** — present in all three key builders |

The last four are vestigial: they exist only because the storage operations read them, and they are
frozen constants rather than state. That is the price of not touching storage operations, and it is
a cheap price — four scalar fields against 26 dropped ones.

### The audit, with evidence

`packages/api-headless-cms-ddb/src/operations/entry/keys.ts`:

- `createEntryRevisionKeys` needs `id`, `tenant`, `version`, `modelId`, `expiresAt`
- `createEntryLatestKeys` and `createEntryPublishedKeys` need `id`, `tenant`, `modelId`, `expiresAt`
- `createPartitionKey` → `parseIdentifier(id)`; `createGSIPartitionKey` → `tenant` + `modelId`;
  `createGSISortKey` → `id`

`DdbCreateEntry.ts` reads `entry.status`, `entry.locked`, `entry.tenant`. It writes **two items** —
`createEntryRevisionKeys` (`SK = REV#0001`) and `createEntryLatestKeys` (`SK = L`) — and a third only
when status is published, which for simple entries never happens.

`DdbUpdateEntry.ts` reads `entry.status`, `entry.locked`, `entry.id`, `entry.tenant`, then calls
`pickEntryMetaFields(entry, isEntryLevelEntryMetaField)`. **Verified safe:** `pickEntryMetaFields`
(`api-headless-cms/src/constants.ts:78`) sets any absent field to `undefined` rather than throwing,
so a reduced entry passes through it. It does mutate the object it is handed, which is worth knowing
but not a blocker.

`DdbDeleteEntry.ts` reads `entry.id || entry.entryId` and `model.tenant`, then `queryAll`s the
entry's own partition and batch-deletes every item in it. Bounded by one entry, so this is fine.

`DdbGetEntry.ts` **delegates to `ListEntriesStorageOperation` with `limit: 1`** — see the risk
section; this is the one finding that may force a decision.

### What is dropped

26 of the 28 meta fields in `IEntryEntityAttributesData` (14 revision-level, 14 entry-level; only
`createdOn` and `createdBy` survive), plus `location`, `system`, `live`, `revisionDescription`,
`meta`, `wbyDeleted` and `binOriginalFolderId`.

## What this means at the storage level

Two items per write, not one. The `L` item cannot be dropped: `DdbListEntries` queries
`createGSIPartitionKey(model, type)` with `type` of `"L"` or `"P"`, so list and get are answered from
the latest-item GSI partition. Writing only the `REV#0001` item would make every simple entry
invisible to list.

So the saving here is envelope size, not item count — which is the right target: the measured 4,041
bytes per record was dominated by 28 meta fields written twice, and that is exactly what goes away.

## Risks and findings

**The DynamoDB-only read path constrains nothing here.** `DdbGetEntry` delegates to
`ListEntriesStorageOperation` with `limit: 1`, and `DdbListEntries` (`:69`) calls `queryAll` with no
limit, then filters and sorts in JavaScript (`:138`, `:157`, `:168`). That path is only reached on a
DynamoDB-only deployment, which this feature does not target. Recorded so nobody re-derives it, not
because it needs solving.

**OpenSearch indexing is required, not incidental.** `ddb-es` writes to OpenSearch unconditionally
(`DdbEsCreateEntry.ts:120-140`), and per-model index settings offer no way to decline
(`CmsModelOpenSearchIndexProvider.ts:5-9`). For simple entries that is the wanted behaviour — the
index is what makes get and list work — so the missing opt-out is a convenience rather than a
constraint.

**The audit above covers the DynamoDB backend only, and the primary backend is search-backed.** The
`ddb-es` and `pg-os` implementations have their own field reads, and the index mapping has its own
expectations. A field the mapping requires and this shape omits fails at index time rather than at
write time, which is the harder failure to spot. The required set is the union across the configured
backends and is not yet known — the first plan item, and the one place the design could still move.

**`id` format is load-bearing.** `parseIdentifier` requires `<entryId>#<version>`. Simple entries
must build `id` with `createIdentifier({ id: entryId, version: 1 })` exactly as
`CreateEntryDataFactory` does, or partition keys break.

## How a model is designated simple

A model carries a tag. `CmsModel.tags?: string[]` already exists — "Models can be tagged to give them
contextual meaning" (`types/model.ts:123`) — and so does `CmsModelCreateInput.tags`
(`types/model.ts:228`). The mechanism therefore needs no type change and no model-builder change: a
single constant is the entire designation.

The tag is a **guard in both directions**:

- a simple operation refuses a model that does not carry the tag;
- a regular entry operation refuses a model that does.

The second half is what stops a simple entry being published, revisioned or binned through the
regular path — the tag is a designation, not a hint.

**Both guards live in the repositories** — the last layer before a storage operation takes the data
and stores it. That placement covers every caller, including anything that resolves a use case
straight from the container and never passes through CRUD, and it needs no change inside the storage
operations.

Twelve regular repositories mutate and therefore carry the guard:

`CreateEntryRepository`, `CreateEntryRevisionFromRepository`, `UpdateEntryRepository`,
`PublishEntryRepository`, `UnpublishEntryRepository`, `RepublishEntryRepository`,
`DeleteEntryRepository`, `MoveEntryToBinRepository`, `DeleteEntryRevisionRepository`,
`DeleteMultipleEntriesRepository`, `MoveEntryRepository`, `RestoreEntryFromBinRepository`.

The ten `Get*`/`List*` repositories are read-only and are left alone. `UpdateRevisionDescription` and
`UpdateSingletonEntry` have no repository of their own and are covered through the twelve — which is
the clearest evidence that the repository layer is the real chokepoint rather than a convenient one.

## Surface

No GraphQL. The five operations are reached through code — CRUD, use cases, repositories — as
`simpleCreateEntry`, `simpleUpdateEntry`, `simpleGetEntry`, `simpleListEntries` and
`simpleDeleteEntry`. That takes the SDL generator, the resolvers and the schema snapshot tests out of
scope entirely. A GraphQL surface later would be additive and would change nothing here.

## Structure

One abstraction per file under `abstractions/`, camelCase slice directories, one class per file for
errors and events — per `webiny-api-architect` and `ai-context/code-style/`, with
`packages/app-audit-logs/src/features/listAuditLogs/` as the existing precedent. The spec records the
three points where this diverges from `contentEntry/`, which predates those rules.

## Authorization and events

Use cases check `accessControl.canAccessEntry`, exactly as the regular slices do. They publish **no
domain events**.

One consequence worth recording: with no GraphQL layer and no events, a simple entry write has no
hook of any kind. Anything that later needs to react to one — a change feed, an audit trail, a cache
invalidation — has to add events to these slices first. That is cheap to do, but it is not free, and
nothing will surface the gap until something needs it.

---

## Phase 0 — cross-backend field audit (complete, 2026-09-10)

**Verdict: the eleven-field shape holds. No additions.**

Backends are `ddb`, `ddb-es`, `sql` and `pg-os`. `pg-os` turned out not to be a backend at all —
`PgOsCreateEntry` is a `createDecorator` wrapping an `inner` implementation, calling it and then
writing an OpenSearch sync record (`packages/api-headless-cms-pg-os/src/operations/entry/PgOsCreateEntry.ts`).
Its field requirements are SQL's plus the sync writer's, and `SyncHelpers.writeSyncForEntry` reads no
entry field — it passes `entry` and `storageEntry` through whole.

| Field | Read by | Evidence |
| --- | --- | --- |
| `id` | ddb, ddb-es, sql | `createPartitionKey` → `parseIdentifier` (ddb `keys.ts:18-22`, ddb-es `keys.ts:7-11`); `DdbUpdateEntry` `entry.id`; `SqlUpdateEntry` `storageEntry.id`; `SqlDeleteEntry` `entry.id` |
| `entryId` | ddb, ddb-es | `DdbDeleteEntry` / `DdbEsDeleteEntry` — `entry.id \|\| entry.entryId` |
| `tenant` | ddb, ddb-es | every key builder; `dataLoaders.clearAll({ tenant })` |
| `modelId` | ddb | `createGSIPartitionKey` (ddb `keys.ts:44-48`). ddb-es keys never use it |
| `version` | ddb, ddb-es | `createRevisionSortKey` → `REV#${zeroPad(version)}` |
| `status` | ddb, ddb-es, sql | `DdbCreateEntry`, `DdbUpdateEntry`, ddb-es equivalents, `SqlCreateEntry.ts:36` |
| `locked` | ddb, ddb-es | `DdbCreateEntry`, `DdbUpdateEntry`, `DdbEsCreateEntry` (which also mutates it) |
| `expiresAt` | ddb | all three ddb key builders. Absent from ddb-es keys |
| `values` | all | the payload |
| `createdOn`, `createdBy` | none | present by requirement, not by storage constraint |

**`isLatest` / `isPublished` are not required *inputs*, but SQL does persist them.** Corrected after
the integration test ran: `SqlCreateEntry.ts:35-42` assigns them from `status` and only then deletes
them from the in-memory object — the insert has already captured them, so they become columns and
come back on read. Measured stored field sets: **ddb writes exactly the eleven declared fields; SQL
writes thirteen**, the eleven plus these two. Both are derived from `status`, which the shape pins,
so they carry no new state and nothing needs to change in the shape. The integration test pins the
persisted field set per backend so a third extra cannot appear unnoticed.

**ddb-es needs strictly less than ddb.** Its key builders take only `id`, `tenant` and `version` — no
`modelId`, no `expiresAt`, and no GSI attributes, because listing is answered by OpenSearch rather
than a GSI. The union is driven entirely by the DynamoDB-only backend.

### The index-mapping risk, resolved and replaced

The design anticipated that a field the index mapping expects and the shape omits would fail at index
time. That is not how it works: `prepareEntryToIndex` returns `{ ...storageEntry, values, rawValues }`
(`entryIndexHelpers.ts`), mandating no meta field, and a document missing a mapped field indexes
fine. That risk is withdrawn.

What replaces it is narrower and real. The index name is
`[shared ? "root" : tenant, "headless-cms", modelId].join("-")`
(`DefaultCmsModelOpenSearchIndexProvider.ts`) — **one index per model**, with `shared` controlling
only whether it is tenant- or root-prefixed. A simple model therefore gets its own index in which
every dropped meta field is **unmapped**, because nothing in that index ever writes one.

Consequences:

- **Default listing works.** `createElasticsearchSort` falls back to `[{ "id.keyword": { order: "asc" } }]`
  when no sort is given (`sort.ts:48-56`), and `id` is in the shape. `search_after` pagination uses
  the sort value of the last hit, so it works too.
- **Sorting by a dropped meta field fails at query time**, not silently — OpenSearch rejects a sort on
  an unmapped field. `savedOn_DESC`, a normal CMS sort, is the obvious trap.
- **Filtering by a dropped meta field matches nothing** rather than erroring.

**Action taken:** `IListSimpleEntriesParams.sort` is typed to the fields that exist rather than
`string[]`, turning a runtime OpenSearch error into a compile error. See the spec.
