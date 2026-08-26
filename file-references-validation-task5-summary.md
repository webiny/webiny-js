# Task 5 findings — summary

Full report: `file-references-validation.md` (§5.1–§5.6)

## The two hard problems from Task 1 both dissolve

**1. Hooks receive fully decoded values.** Events are published in the **UseCase**; the `toStorage`
transform happens inside the **Repository**, on a separate object:

```ts
await this.eventPublisher.publish(new EntryBeforeCreateEvent({ entry, input, model }));
const result = await this.repository.execute(model, entry);   // ← toStorage happens in here
await this.eventPublisher.publish(new EntryAfterCreateEvent({ entry, input, model }));
```

`entryStorageTransform` returns a **new** object, so `entry` is never mutated into storage form.
**No `fromStorage` needed.** Task 1's gzip problem is confined to a raw-table backfill — which these
hooks let you avoid entirely. The payload also carries the full `model` with `fields`.

**2. The model-tree walker already exists.** `ContentEntryTraverser` walks the model AST in step
with the value tree, calling `visitor({ field, value, path })` for every field — descending into
`object` children, list items with indexed paths, and `dynamicZone` collections resolved by
discriminator. Obtained via `ContentEntryTraverserProvider.getTraverser(modelId)`. Currently used by
exactly one caller (`normalizeGraphQlInput.ts`). This is precisely the "walk the model tree in step
with the value tree" requirement Task 1 identified.

## One registration point covers everything

**WB content *is* CMS content.** `wbyWbPage` and `wbyWbVariant` are private CMS models written
through `Create/Update/CreateEntryRevisionFromUseCase` — e.g. `UpdatePageRepository.ts:35` calls
`this.updateEntry.execute(this.pageModel, …)`. So **a single `EntryAfterUpdateEventHandler` covers
WB pages, WB variants, and every user model at once.** No cross-app abstraction needed.

`isPrivate` is checked in only three places — `ListModelsRepository.ts:40`, the GraphQL schema, and
export — all API-surface concerns. **It does not gate lifecycle events.**

WB *also* publishes its own `page.afterUpdate` etc., but those cover pages only; listening at the
CMS level is one registration instead of three.

**Revisions: you need three hooks, not one.** In-place edit fires `Update`; a *new* revision fires
`Cms/Entry/RevisionBeforeCreate`/`RevisionAfterCreate` — **not** Create or Update. Minimum coverage:
`AfterCreate` + `AfterUpdate` + `RevisionAfterCreate` + `AfterDelete`.

## Registry: no extractor registry, but a clear shape to copy

The established pattern for **server-side per-field-type behaviour** is `StorageTransform` —
`packages/api-headless-cms/src/features/storage/StorageTransformRegistry.ts`. Keyed on `fieldType`,
DI multi-injection (`[[StorageTransform, { multiple: true }]]`), resolution order exact → base type
(`getBaseFieldType`, handles `type:subtype`) → `*` default. A plugin adds a field type by shipping
one more `createImplementation`.

`CmsModelFieldToGraphQLRegistry` has the same shape but its concern is schema generation. The
`FieldFilter*`/`FieldSorting*` registries are storage-internal and narrower.

## Backfill: the pattern exists, with one gap you must close

**`EntriesBulkAction`** (`api-headless-cms-bulk-actions/src/features/EntriesBulkAction/abstractions.ts`)
— `loadData(model, { where, search, after, limit })` / `processData`, driven by parent/child tasks
with `isCloseToTimeout()` → `response.continue(...)`, batches of 10 child tasks, and cursor advance
`listEntriesParams.after = meta.cursor`.

**The gap:** `CreateTasksByModel` advances the cursor **only in a local variable** — on continuation
it returns `{ ...input, action: … }` with `input.after` *unchanged*. That's safe for shipped bulk
actions because they **mutate what they scan** (delete/publish/move), so a re-scan returns the
remainder. `DeleteModelTask` has the same destructive-scan shape with no cursor at all.

A reference backfill is **read-only and idempotent**, so an unchanged cursor restarts the pass on
every timeout and never converges. It must persist the cursor into its own continued input —
exact precedent: `DeleteS3FolderTask.ts:72`, `response.continue({ ...input, continuationToken })`.

## Storage for the reference records

| Option | By file ID | By source ID | Backend-independent | Build cost |
|---|---|---|---|---|
| Private CMS model | O(1) indexed **with OpenSearch**; **full model scan on DDB-only** | same | ✗ | Lowest |
| Direct DDB + GSI | One `Query` | One `Query` (GSI) | ✓ | Highest |
| Key-value store | O(1) point read | O(1) point read (second key) | ✓ | Low, but 400 KB/key ceiling, no pagination |

The DDB-only number is the one that matters: `DdbListEntries.ts:69` does
`entity.queryAll({ index: "GSI1", … })` and then filters **in memory** — every list call reads every
entry of the model into Lambda. On OpenSearch backends the same model is a real indexed query
(`DdbEsListEntries.ts`). If a reference index lives in a private CMS model, its by-file-ID query
degrades to a full scan on DDB-only deployments.

Direct DDB + GSI is the only option cheap on **both** access patterns on **every** backend. The KV
store has no list/query/prefix-scan at all — only point `get`/`set`/`delete` on `{scope}:{key}` —
so it works only if you write both directions explicitly, and each value is capped at one DynamoDB
item.
