# Simple content entries

A content entry with the revision and publishing dimensions removed and the meta-field envelope cut
to what is actually needed.

A simple entry is a normal CMS entry: same `CmsModel`, same storage operations, same table. Nothing
in the `api-headless-cms-*` storage packages knows this feature exists. What differs is the shape
that goes in, and the fact that only five operations are offered.

Design, spec and plan live in `docs/.bruno/` (`2026-09-10-simple-content-entries-*`).

## The entry shape

`ISimpleCmsEntry` (`types.ts`) has eleven fields. Seven carry identity and payload; four are
**pinned** — they exist because the storage operations read them, and they never hold any value but
the one below.

| Field       | Why it exists                                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`        | `<entryId>#0001`. The storage key builders run `parseIdentifier` over it, so the revision suffix has to be there even though there is only one revision. |
| `entryId`   | `DeleteEntry` falls back to `entry.id \|\| entry.entryId`.                                                                                               |
| `tenant`    | Every key builder — `createBasePartitionKey` throws without it.                                                                                          |
| `modelId`   | The DynamoDB GSI partition key.                                                                                                                          |
| `values`    | The payload.                                                                                                                                             |
| `createdOn` | Required by us, not by storage.                                                                                                                          |
| `createdBy` | Required by us, not by storage.                                                                                                                          |
| `version`   | **Always `1`.** Feeds `REV#${zeroPad(version)}`.                                                                                                         |
| `status`    | **Always `"draft"`.**                                                                                                                                    |
| `locked`    | **Always `false`.**                                                                                                                                      |
| `expiresAt` | **Always `null`.**                                                                                                                                       |

The 26 remaining entry- and revision-level meta fields are not stored. `createdOn` and `createdBy`
are the only two of the 28 that survive.

### The invariant

**A simple entry is always a single unpublished draft. It is never published and never locked.**
Nothing may change that, and four things make sure of it:

1. **Literal types.** `status: "draft"`, `locked: false`, `version: 1`, `expiresAt: null` — assigning
   anything else does not compile.
2. **`readonly`.** Reassigning one on an existing entry does not compile either.
3. **`assertSimpleEntryInvariants`**, called by both write repositories before anything reaches
   storage. A violation throws `SimpleEntryInvariantError`, so no caller can persist a broken entry
   — not through CRUD, not through a use case resolved straight from the container.
4. **`assertRegularModel`** on the twelve mutating regular repositories, so `publishEntry`,
   `unpublishEntry` and the rest refuse a simple model outright. There is no operation anywhere that
   could publish or lock one.

The update factory re-applies all four from the constants rather than copying them off the original,
so even a stored record that somehow broke the invariant cannot carry it forward.

## The five use cases

All of them return a `Result` and never throw for an expected failure. None of them publishes domain
events. Each checks `AccessControl` first, then delegates to its repository.

### CreateSimpleEntryUseCase

```ts
execute<TValues>(model: CmsModel, input: ICreateSimpleEntryInput<TValues>)
    : Promise<Result<ISimpleCmsEntry<TValues>, Error>>
```

Checks `canAccessEntry({ model, rwd: "w" })`, builds the entry through
`CreateSimpleEntryDataFactory`, re-checks access with the built entry, then persists via
`CreateEntryStorageOperation`.

`input.id` is optional. Supplied, it is validated against the same pattern the regular factory uses
and becomes the `entryId`; omitted, an `mdbid()` is generated. Either way `id` is
`createIdentifier({ id: entryId, version: 1 })`.

Fails with: `SimpleEntryNotAuthorizedError`, `SimpleEntryValidationError`, `ModelNotSimpleError`,
`SimpleEntryPersistenceError`.

### UpdateSimpleEntryUseCase

```ts
execute<TValues>(model: CmsModel, id: string, input: IUpdateSimpleEntryInput<TValues>)
    : Promise<Result<ISimpleCmsEntry<TValues>, Error>>
```

Checks `rwd: "w"`, resolves the existing entry through `GetSimpleEntryUseCase`, merges through
`UpdateSimpleEntryDataFactory`, then persists via `UpdateEntryStorageOperation`.

**Only `values` changes.** Identity, `createdOn`, `createdBy` and the four pinned fields are carried
over from the original. There is no `savedOn` or `modifiedOn` to refresh — a simple entry records
only when it was created. No second revision is created; the single `REV#0001` item is rewritten.

If the entry does not exist it returns `SimpleEntryNotFoundError` and **writes nothing**.

### GetSimpleEntryUseCase

```ts
execute<TValues>(model: CmsModel, params: IGetSimpleEntryParams)
    : Promise<Result<ISimpleCmsEntry<TValues>, Error>>
```

Checks `rwd: "r"`. Takes `{ where: { id?, entryId? } }`; a versioned `id` is reduced to its entry id
with `parseIdentifier` first. Resolves through `GetLatestRevisionByEntryIdStorageOperation`, which is
data-loader backed and therefore cheaper than the generic get — and correct here because a simple
entry has exactly one revision, so the latest revision _is_ the entry.

**Never returns `null`.** Absence is `SimpleEntryNotFoundError`. Passing neither `id` nor `entryId`
is also a not-found, and does not reach storage.

### ListSimpleEntriesUseCase

```ts
execute<TValues>(model: CmsModel, params?: IListSimpleEntriesParams)
    : Promise<Result<IListSimpleEntriesResult<TValues>, Error>>
```

Checks `rwd: "r"`, then `ListEntriesStorageOperation`. Defaults to `limit: 50` and
`sort: ["createdOn_DESC"]`. Returns `{ items, meta }` where `meta.cursor` is `null` unless
`hasMoreItems`.

**`sort` is deliberately not `string[]`.** It is
`` `${"id" | "createdOn" | `values.${string}`}_${"ASC" | "DESC"}` ``. A simple model gets its own
OpenSearch index (`<tenant|root>-headless-cms-<modelId>`), so every dropped meta field is unmapped
there and sorting on one fails at query time. Restricting the type turns that into a compile error.
`createdOn` is safe precisely because the shape carries it.

### DeleteSimpleEntryUseCase

```ts
execute(model: CmsModel, id: string): Promise<Result<void, Error>>
```

Checks `rwd: "d"`, resolves the entry, then `DeleteEntryStorageOperation`, which purges every item
under the entry's partition. **Permanent — there is no bin.** A missing entry returns
`SimpleEntryNotFoundError` and deletes nothing.

## Slice anatomy

Every slice is the same six files, following `webiny-api-architect` and `ai-context/code-style/`:

```
createSimpleEntry/
├── abstractions/
│   ├── CreateSimpleEntryUseCase.ts        one abstraction per file
│   ├── CreateSimpleEntryRepository.ts
│   └── index.ts                           barrel
├── CreateSimpleEntryUseCase.ts            implementation, transient
├── CreateSimpleEntryRepository.ts         implementation, singleton
├── feature.ts                             DI registration
└── index.ts                               exports abstractions only
```

Use cases orchestrate and hold no storage knowledge. Repositories are the only place that touches a
storage operation, and the only place that holds the `entry as unknown as CmsEntry` cast — the seam
between the reduced shape and the storage contract. Keep it there.

`SimpleContentEntriesFeature.ts` registers the factories then the five slices, queries before
commands, and is itself registered from `HeadlessCmsFeature.ts`.

## Data factories

Injectable, singleton, reached by DI rather than imported (see AGENTS.md, Entry Data Factory
Pattern).

- **`CreateSimpleEntryDataFactory`** — cleans input values against the model's fields, validates,
  maps reference fields, then assembles the eleven-field entry with the pinned constants.
- **`UpdateSimpleEntryDataFactory`** — re-validates and re-maps the new values, then returns
  `{ ...original, values }`. Validation receives the original entry, so validators that need it
  still work.

Both go through `EntryDataProcessor` (`features/contentEntry/entryDataProcessor/`), a shared service
wrapping validation and reference mapping so neither factory imports from `~/crud/`.

## The guards

The `SIMPLE_MODEL_TAG` (`"cms:simple"`) in `model.tags` is a designation, not a hint, and it is
enforced **in both directions from the repositories** — the last layer before a storage operation
stores anything. That placement covers every caller, including anything resolving a use case
straight from the container and bypassing CRUD.

- `assertSimpleModel` — first statement of the five simple repositories. Throws
  `ModelNotSimpleError` on an untagged model.
- `assertRegularModel` — first statement of the **twelve mutating regular** repositories. Throws
  `ModelIsSimpleError`, so a simple model cannot be published, revisioned, moved or binned through
  the regular path.

Both throw rather than returning a `Result`: the repositories already wrap thrown errors, and a
repository reached with the wrong kind of model is a programming error, not an expected failure.

The **ten read-only** regular repositories are deliberately unguarded, so a simple entry stays
readable through `getEntry` and `listEntries`. `modelGuards.test.ts` asserts the wiring by walking
the directory, so adding a mutating repository without the guard fails the suite.

## Using it

Through the facade — `HeadlessCms` carries all five methods, and they throw on failure:

```ts
import { HeadlessCms } from "@webiny/api-headless-cms/features/shared/abstractions.js";

const cms = container.resolve(HeadlessCms);
const model = await cms.getModel("simpleNotes");

const entry = await cms.simpleCreateEntry(model, { values: { title: "Hello" } });
const page = await cms.simpleListEntries(model, { limit: 20 });
await cms.simpleUpdateEntry(model, entry.id, { values: { title: "Changed" } });
await cms.simpleDeleteEntry(model, entry.id);
```

Or resolve a use case directly when you want to branch on the error instead of catching. Everything a
consumer needs comes from one curated module, `exports/api/cms/simpleEntry.js` — the same way other
packages import the regular entry use cases from `exports/api/cms/entry.js`:

```ts
import {
  CreateSimpleEntryUseCase,
  SIMPLE_MODEL_TAG
} from "@webiny/api-headless-cms/exports/api/cms/simpleEntry.js";
import type { ISimpleCmsEntry } from "@webiny/api-headless-cms/exports/api/cms/simpleEntry.js";

const result = await container.resolve(CreateSimpleEntryUseCase).execute(model, {
  values: { title: "Hello" }
});
if (result.isFail()) {
  // result.error.code === "Cms/SimpleEntry/..."
}
```

That module exports the five use cases, the two data factories, `SIMPLE_MODEL_TAG`, the types and the
six error classes. It does **not** export the repositories — those are internal wiring, and nothing
outside a use case should call one.

## Declaring a simple model

Tag it. `.tags()` is on `BaseModelBuilder`, so it is available on both private and public builders:

```ts
class SimpleNotesModel implements ModelFactory.Interface {
  async execute(builder: ModelFactory.Builder) {
    return [
      builder
        .private({ modelId: "simpleNotes", name: "Simple Notes" })
        .tags([SIMPLE_MODEL_TAG])
        .fields(fields => ({ title: fields.text().label("Title") }))
    ];
  }
}
```

Without the tag every simple operation refuses the model. With it, the regular mutating operations
refuse it.

## What actually lands in storage

Two items per entry, not one: `SK = REV#0001` and `SK = L`. The `L` item cannot be dropped —
`DdbEsListEntries` and `DdbListEntries` read the latest-item partition, so an entry without it would
be invisible to list. The saving here is envelope size, not item count.

Measured stored field sets:

| Backend | Fields | Notes                                         |
| ------- | ------ | --------------------------------------------- |
| `ddb`   | 11     | Exactly the declared shape.                   |
| `sql`   | 13     | The eleven plus `isLatest` and `isPublished`. |

The two SQL extras are not inputs we supply: `SqlCreateEntry` assigns them from `status` and only
then deletes them from the in-memory object, so the insert has already captured them and they come
back on read. Both derive from `status`, which the shape pins, so they carry no new state.
`simpleEntries.test.ts` pins the persisted field set per backend so a third extra cannot appear
unnoticed.

## Deliberately absent

- **No domain events.** Use cases check `AccessControl` but publish nothing. With no GraphQL layer
  either, a simple entry write currently has no hook at all — anything that needs to react to one
  has to add events to these slices first.
- **No GraphQL.** No SDL generator, no resolvers. The operations are reached through code.
- **No revisions, no publishing, no bin.** No `createRevisionFrom`, `publish`, `unpublish`,
  `republish`, `moveToBin`, `restoreFromBin`, `updateRevisionDescription`, and no singleton
  variants. `contentEntry/` has 29 slices; this has five.

## Testing

Unit suites live in `__tests__/features/simpleContentEntries/` (factory, read path, write path,
guards, CRUD). The storage-backed suite is `__tests__/storageOperations/simpleEntries.test.ts`.

A storage suite without a flag **skips silently and still exits 0**, so a green run proves nothing on
its own:

```bash
yarn test packages/api-headless-cms                          # ddb (the default)
WEBINY_STORAGE=sql yarn test packages/api-headless-cms       # sqlite
yarn test:os packages/api-headless-cms                       # search-backed
```

The search-backed configurations (`ddb-es`, `pg-os`) are what production runs and are **not yet
verified** — the integration suite has only been run against `ddb` and `sql`.
