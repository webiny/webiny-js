# CMS singleton entries: publishing and revisions

Status: draft
Date: 2026-11-26

## Goal

A singleton model (tag `singleEntry`) gets the same lifecycle as a regular entry: draft, publish,
unpublish, and multiple revisions. Today a singleton has exactly one revision, `#0001`, that is
never published and is served by every endpoint as-is.

All paths below are relative to `packages/api-headless-cms/src` unless stated otherwise.

## Current state

- `features/contentEntry/GetSingletonEntry/GetSingletonEntryUseCase.ts` derives
  `id = createCacheKey(model.modelId)` (sha256 hex of the modelId) and reads the fixed revision
  `${id}#0001` (line 36). If it is missing, it creates it with `skipValidation: true`.
- `features/contentEntry/UpdateSingletonEntry/UpdateSingletonEntryUseCase.ts` gets that entry and
  calls `UpdateEntryUseCase` on its id.
- GraphQL (`graphql/schema/createSingularSDL.ts`, `createSingularResolvers.ts`) exposes
  `get<Singular>` on every endpoint and `update<Singular>` on manage. The type `<Singular>` is one
  string shared by read and manage SDL (the manage SDL appends to it).
- `graphql/schema/schemaPlugins.ts:52` maps every non-manage endpoint to `read`
  (`type === "manage" ? "manage" : "read"`), so read and preview run the same use case.
- Consequences:
  - The read API returns the draft `#0001`. It also creates the entry if it does not exist.
  - No publish, unpublish, revision list or revision creation for singletons.
- Publishing locks a revision: `features/contentEntry/entryDataFactories/CreatePublishEntryDataFactory/CreatePublishEntryDataFactory.ts:57`
  sets `locked: true`. `features/contentEntry/UpdateEntry/UpdateEntryUseCase.ts:47` rejects a locked
  revision with `EntryLockedError` (`domain/contentEntry/errors.ts`).
- Owner access: `features/contentEntry/shared/entryOwnerAccess.ts` exempts singletons from
  entry-level ("own entries") checks through `isSingletonModel`, `canAccessLoadedEntry` and
  `filterAccessibleEntries`. Users of the exemption:
  - `UpdateEntryUseCase.ts:53` and `:77`.
  - The read and revision use cases, through the helpers: `GetLatestRevisionByEntryId`,
    `GetPublishedRevisionByEntryId`, `GetRevisionById`, `GetPreviousRevisionByEntryId`,
    `GetRevisionsByEntryId`.

  Missing the exemption (they call `canAccessEntry({ model, entry, ... })` directly):
  - `features/contentEntry/PublishEntry/PublishEntryUseCase.ts:46`
  - `features/contentEntry/UnpublishEntry/UnpublishEntryUseCase.ts:54`
  - `features/contentEntry/CreateEntryRevisionFrom/CreateEntryRevisionFromUseCase.ts:54` and `:75`
  - `features/contentEntry/DeleteEntryRevision/DeleteEntryRevisionUseCase.ts:64`
- Workflows: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflowModels/ListCmsEntryWorkflowModelsUseCase.ts:101`
  filters singleton models out with its own module-private `isSingletonModel` (`:26`), so a
  singleton cannot be bound to a workflow.
- Scheduler: `api-headless-cms-scheduler` `SchedulePublishEntryUseCase.ts:28` and
  `ScheduleUnpublishEntryUseCase.ts:28` run only the model-level check (`canAccessEntry({ model, pw })`).
  Nothing stops scheduling a singleton entry today.

## The generated id is not a problem

- `entryId` is a stable hash of the modelId. Further revisions are `${entryId}#0002`, `#0003`, like
  any entry.
- Singletons are stored through the generic entry storage operations. DDB keeps revision, latest
  and published records under the `entryId` partition (`packages/api-headless-cms-ddb/src/operations/entry/keys.ts`:
  `createRevisionSortKey`, `createLatestSortKey`, `createPublishedSortKey`). DDB-ES and both SQL
  storage packages (`api-headless-cms-sql` for SQLite and `api-headless-cms-pg` for Postgres) use the
  same generic entry operations. Nothing is specific to singletons, so
  no key format changes.
- The only code that assumes revision `#0001` is `GetSingletonEntryUseCase.ts:36`. Existing
  singleton entries at `#0001` are a valid revision 1 with latest records. No data migration is
  needed for storage. See D3 for the change in read API behaviour.

## Design

### Backend: resolve the singleton per endpoint

Replace the fixed `#0001` read with a lookup by `entryId`:

| Endpoint | Returns | Creates if missing |
|---|---|---|
| manage | latest revision (`GetLatestRevisionByEntryId`) | yes, as today |
| preview | latest revision (`GetLatestRevisionByEntryId`) | yes, as today |
| read (6.6) | latest revision, as today (D3) | yes, as today |
| read (6.7) | published revision (`GetPublishedSingletonEntryUseCase`); before the first publish, the entry with empty values (D2) | yes, as today |

Every endpoint creates the singleton entry when it does not exist. A site that reads keys from a
singleton gets an entry with empty values, never a not-found error or `null` data.

- Signatures: `GetLatestRevisionByEntryId.execute(model, { id })`
  (`GetLatestRevisionByEntryId/abstractions.ts:16-19`) and
  `GetPublishedRevisionByEntryId.execute(model, entryId)`, returning `CmsEntry | null`
  (`GetPublishedRevisionByEntryId/abstractions.ts:13-16`). The singleton use cases pass `model` and
  the singleton `entryId`.
- `schemaPlugins.ts` must pass the real endpoint type (`read` vs `preview`) to the singular SDL and
  resolvers instead of collapsing both to `read`.
- Add an `isSingletonModel` export to the existing `exports/api/cms/model.ts` so other packages (scheduler,
  workflows) use one helper. Replace the private copy in `ListCmsEntryWorkflowModelsUseCase.ts:26`.
- Extract the `entryId` derivation into one helper (`createSingletonEntryId(model)`) so every use
  case uses the same value.
- `get<Singular>` creates the entry only when called without `revision`. With a `revision`,
  it checks the prefix (below) and fetches that revision; it never creates.
- Every singleton use case that takes a `revision` argument checks that it starts with
  `${entryId}#` and fails with `EntryNotFoundError` otherwise. Without this, a caller could publish
  or delete another entry's revision through the singleton API.
- Split `GetSingletonEntryUseCase` into a manage variant (get latest or create) and read and
  preview variants (no create). One use case per file.

### Backend: new singleton use cases

Each is a thin use case that resolves the singleton `entryId` and delegates to the existing generic
use case. One use case per file.

| Singleton use case | Delegates to |
|---|---|
| `PublishSingletonEntryUseCase` | `PublishEntry` (latest revision, or a given revision id) |
| `UnpublishSingletonEntryUseCase` | `UnpublishEntry` (the published revision) |
| `CreateSingletonEntryRevisionUseCase` | `CreateEntryRevisionFrom` (latest, or a given revision id) |
| `DeleteSingletonEntryRevisionUseCase` | `DeleteEntryRevision` |
| `ListSingletonEntryRevisionsUseCase` | `GetRevisionsByEntryId` |
| `GetPublishedSingletonEntryUseCase` | `GetPublishedRevisionByEntryId`; ships in 6.6, used by the read API from 6.7 (D3) |
| `UpdateSingletonEntryUseCase` (changed) | Entry missing: create it (as the manage get does), then `UpdateEntry`. Otherwise `UpdateEntry` on the latest revision. A locked latest revision fails with `EntryLockedError`, as for regular entries (D1) |

### Backend: access control

Add the singleton exemption from the entry-level owner check to the four use cases listed under
"Missing the exemption", using `isSingletonModel`. Model-level checks (`pw: "p"`, `pw: "u"`,
`rwd: "w"`, `rwd: "d"`) stay. Without this, a user with "own entries" and publish permission cannot
publish a singleton someone else created.

### Events

Delegating to the generic use cases fires the normal entry events for publish, unpublish, revision
create and revision delete. Consumers (webhooks, audit logs, search index) see singleton entries in
these events like any other entry. This is intended. Consumers that must tell singletons apart use
`isSingletonModel(model)`.

### GraphQL SDL

The `meta` field and all new operations exist on the manage API only. `createSingularSDL.ts` must
emit them in the manage branch, not in the shared `read` string, so the read and preview types do
not get `meta`.

Manage API, following the conventions of the regular manage SDL (`graphql/schema/createManageSDL.ts`):

```graphql
type <Singular>Meta {
    # Same fields as the regular <Model>Meta (createManageSDL.ts:100-115):
    modelId: String
    version: Int
    locked: Boolean
    status: String
    system: CmsEntrySystem
    revisions: [<Singular>!]
    title: String
    description: String
    image: String
}

extend type <Singular> {
    meta: <Singular>Meta
}

extend type Query {
    get<Singular>(revision: ID): <Singular>Response
    get<Singular>Revisions: <Singular>ArrayResponse
}

extend type Mutation {
    update<Singular>(data: <Singular>Input!, options: UpdateCmsEntryOptionsInput): <Singular>Response
    publish<Singular>(revision: ID): <Singular>Response
    unpublish<Singular>: <Singular>Response
    create<Singular>From(revision: ID, data: <Singular>Input, options: CreateRevisionCmsEntryOptionsInput): <Singular>Response
    delete<Singular>Revision(revision: ID!, options: CmsDeleteEntryOptions): CmsDeleteResponse
}
```

Deviations from the regular manage SDL, with reasons:

- `publish<Singular>(revision: ID)`: optional, defaults to the latest revision. There is only one
  entry, so the client does not need to know a revision id for the common case.
- `unpublish<Singular>`: no argument. Only one revision can be published.
- `create<Singular>From(revision: ID)`: optional, defaults to the latest revision.
- `get<Singular>Revisions`: no `id` argument, the entry is implied.
- `delete<Singular>Revision`: named for the revision. Deleting the whole singleton entry stays
  unsupported, as today.
- `<Singular>ArrayResponse` is new for singletons; copy the regular `<Model>ArrayResponse` shape.

Read and preview keep `get<Singular>` without arguments and without `meta`.

### Admin app (`packages/app-headless-cms/src`)

- Gateways and use cases in `features/contentEntry/singletonEntry/` for publish, unpublish, create
  revision, delete revision, list revisions.
- `presentation/contentEntries/singleEntry/SingleEntryPresenter.ts` and
  `presentation/contentEntries/views/SingleEntryView.tsx`: status badge, Publish and Unpublish
  actions, revision selector, new revision flow. Reuse the regular entry editor's components; no
  custom styling.

## Decisions

Proposed defaults. Each is open until confirmed.

- **D1. Update on a locked (published) revision. Decided: not allowed, as today.**
  `update<Singular>` on a locked latest revision fails with `EntryLockedError`
  (`UpdateEntryUseCase.ts:47`). To change a published singleton, the client calls
  `create<Singular>From` first and updates the new revision. Only internal code (for example
  `UpdateEntrySystem`) may change a locked revision. Concurrent saves behave as for regular entries.
- **D2. Read API before the first publish (6.7). Decided: empty values, never not found.** The
  entry is created if missing (as today). If no revision is published, read returns the singleton
  with its `id` and `entryId` and empty `values`. It never returns draft values, and never `null`
  data or a not-found error.
- **D3. Existing singletons. Decided: phased, no upgrade script.**
  - **6.6:** publishing and revisions ship. `GetPublishedSingletonEntryUseCase` exists, but the read
    API does not use it yet. Read keeps today's behaviour and returns the latest revision (today
    that is always `#0001`), so read output does not change for anyone. Editors can publish their
    singletons during 6.6.
  - **6.7:** the read API switches to `GetPublishedSingletonEntryUseCase` and returns only the
    published revision; before the first publish, the entry with empty values (D2). Breaking
    change: announce it in the 6.6 and 6.7 release notes, with the instruction to publish each
    singleton before upgrading to 6.7.
- **D4. Delete a singleton revision.** Default: allowed, except for the only remaining revision and
  the published revision. To delete the published revision, unpublish first. This keeps the read API
  from silently falling back to empty values through a delete.
- **D5. Workflows.** Singletons stay excluded from workflow binding
  (`ListCmsEntryWorkflowModelsUseCase.ts:101`), so no review gate applies to singleton publish.
  Default: keep this for v1.
- **D6. Scheduled publishing.** Default: block. The singleton GraphQL has no schedule operations.
  The generic scheduler path could still schedule a singleton, so `SchedulePublishEntryUseCase` and
  `ScheduleUnpublishEntryUseCase` (`api-headless-cms-scheduler`) reject singleton models explicitly
  with `isSingletonModel` imported from `@webiny/api-headless-cms/exports/api/cms/model.js`
  (the package's `"./*"` exports map covers the path). Revisit with D5.

## Out of scope

- Scheduled publishing for singletons (D6).
- Workflow binding for singletons (D5).

## Tests

- Use case tests per new use case, on DDB, DDB-ES, SQLite (`api-headless-cms-sql`) and Postgres
  (`api-headless-cms-pg`) storage.
- Endpoint tests: every endpoint creates the entry if missing. Preview and manage return latest.
  Read per D3: 6.6 latest; 6.7 published, or empty values before the first publish (D2).
- Read and preview SDL have no `meta` and no mutations.
- Update on a locked latest revision fails with `EntryLockedError` (D1).
- Update when the entry does not exist creates it and applies the update.
- Manage `get<Singular>(revision)` on a model with no entry returns not found and creates nothing.
- A `revision` argument that belongs to another entry fails with `EntryNotFoundError` for publish,
  create-from and delete.
- Deleting the published revision or the only revision fails (D4).
- Scheduling publish or unpublish of a singleton fails (D6).
- A user with "own entries" permission can publish, unpublish, create and delete revisions of a
  singleton created by another user.
- Existing `#0001`-only singleton: manage reads, updates and publishes it with no storage migration.
- 6.6: read returns the latest revision, published or not. 6.7: read returns empty values until the
  first publish, then the published revision (D2, D3).
