# CMS singleton entries: publishing and revisions

Status: draft
Date: 2026-11-26
Release: 6.6, one PR. Phase 1 and phase 2 ship together; nothing merges before both are done.

## Goal

A singleton model (tag `singleEntry`) can opt in to the regular entry lifecycle: draft, publish,
unpublish, revisions, and (phase 2) scheduled publishing. A customer uses a singleton as a global
site setting and needs changes to go live on a schedule. Singletons without the opt-in keep working
as today: one revision, `#0001`, never published.

The admin edits every singleton in the regular entry editor, without the entry list.

All paths are relative to `packages/api-headless-cms/src` unless stated otherwise. Examples use a
singleton model with `singularApiName: "Settings"`.

## Current state

- `features/contentEntry/GetSingletonEntry/GetSingletonEntryUseCase.ts` derives
  `id = createCacheKey(model.modelId)` (sha256 hex of the modelId) and reads the fixed revision
  `${id}#0001` (line 36). If it is missing, it creates it with `skipValidation: true`.
- `features/contentEntry/UpdateSingletonEntry/UpdateSingletonEntryUseCase.ts` gets that entry and
  calls `UpdateEntryUseCase` on its id.
- GraphQL: `graphql/schema/createSingularSDL.ts` and `createSingularResolvers.ts` expose
  `getSettings` on every endpoint and `updateSettings(data, options)` on manage.
  `graphql/schema/schemaPlugins.ts:52` maps every non-manage endpoint to `read`, so read and preview
  run the same use case. The read API returns the draft `#0001` and creates the entry if missing.
  The regular manage SDL (`createManageSDL.ts`) is never emitted for singletons.
- Publishing locks a revision (`CreatePublishEntryDataFactory.ts:57`, `locked: true`).
  `UpdateEntryUseCase.ts:47` rejects a locked revision with `EntryLockedError`.
- Owner access: `features/contentEntry/shared/entryOwnerAccess.ts` exempts singletons from
  entry-level ("own entries") checks through `isSingletonModel`, `canAccessLoadedEntry` and
  `filterAccessibleEntries`. Used by `UpdateEntryUseCase.ts:53,77` and by the read and revision use
  cases (`GetLatestRevisionByEntryId`, `GetPublishedRevisionByEntryId`, `GetRevisionById`,
  `GetPreviousRevisionByEntryId`, `GetRevisionsByEntryId`). Missing from
  `PublishEntryUseCase.ts:46`, `UnpublishEntryUseCase.ts:54`,
  `CreateEntryRevisionFromUseCase.ts:54,75` and `DeleteEntryRevisionUseCase.ts:64`.
- The manage `delete<S>(revision)` resolver (`graphql/schema/resolvers/manage/resolveDelete.ts`)
  calls `DeleteEntryRevisionUseCase` for a revision id and `DeleteEntryUseCase` (whole entry) for an
  id without a version.
- Tag `$publishing:false` opts a regular model out of publishing. It is checked only in the admin
  (`packages/app-headless-cms/src/admin/hooks/useIsModelPublishable.ts:7`, the publish buttons) and
  in workflows (`packages/api-headless-cms-workflows/src/utils/isBindableModel.ts:4`).
- Admin: `presentation/contentEntries/views/ModelLoader.tsx:23` (in `packages/app-headless-cms/src`)
  renders `SingleEntryView` (`SingleEntryPresenter`, save only) for singletons, and `ListView` (list
  plus `ContentEntryFormView`) for regular models.
- Workflows skip singletons: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflowModels/ListCmsEntryWorkflowModelsUseCase.ts:101`
  (private `isSingletonModel` at `:26`) and
  `packages/app-headless-cms-workflows/src/utils/isReviewableModel.ts:8`.

## Storage: no change

- `entryId` is a stable hash of the modelId. Further revisions are `${entryId}#0002`, `#0003`, like
  any entry.
- Singletons use the generic entry storage operations. DDB keeps revision, latest and published
  records under the `entryId` partition
  (`packages/api-headless-cms-ddb/src/operations/entry/keys.ts`). DDB-ES, SQLite
  (`api-headless-cms-sql`) and Postgres (`api-headless-cms-pg`) use the same generic operations.
- The only code that assumes `#0001` is `GetSingletonEntryUseCase.ts:36`. Existing singleton
  entries are a valid revision 1. No key format change and no data migration.

## Opt-in: `$publishing:true`

- A singleton model supports publishing and revisions only when its tags include
  `$publishing:true`. Without the tag ("untagged"), it behaves as today.
- Regular models keep the existing rule: publishable unless tagged `$publishing:false`.
- One shared helper encodes both rules: `isPublishingEnabled(model)`.
  - API: exported from `exports/api/cms/model.ts`, next to an exported `isSingletonModel`. The
    private copy in `ListCmsEntryWorkflowModelsUseCase.ts:26` is replaced by the export.
  - Admin: in `@webiny/app-headless-cms-common`. `useIsModelPublishable` uses it.
- Adding the tag to an existing singleton: the read API returns empty values until an editor
  publishes (see read below). The docs say to publish right after adding the tag. Removing the tag:
  the read API returns `#0001` again; later revisions stay in storage but are not reachable.

## GraphQL

### Read API

`getSettings` (no arguments), unchanged signature:

- Tagged: the published revision. If no revision is published, the entry with its `id`, `entryId`
  and empty `values`. Never draft values, never `null` data, never a not-found error.
- Untagged: `#0001`, as today.
- Creates the entry if it does not exist, as today. A site that reads keys from a singleton always
  gets an entry.
- The read type has no `meta`.

### Preview API

`getSettings` (no arguments): the latest revision, published or not. Creates the entry if missing.
`schemaPlugins.ts` passes the real endpoint type (`read` or `preview`) to the singular SDL and
resolvers instead of collapsing both to `read`.

### Manage API

All operations below exist for every singleton model, tagged or untagged. The schema does not depend
on the tag; the use cases enforce it.

```graphql
type SettingsMeta {
    # Same fields as the regular <Model>Meta (createManageSDL.ts:100-115)
    modelId: String
    version: Int
    locked: Boolean
    status: String
    system: CmsEntrySystem
    revisions: [Settings!]
    title: String
    description: String
    image: String
}

extend type Settings {
    meta: SettingsMeta
}

extend type Query {
    getSettingsLatest: SettingsResponse
    getSettingsRevision(revision: ID!): SettingsResponse
    getSettingsRevisions(id: ID!): SettingsArrayResponse
}

extend type Mutation {
    updateSettings(revision: ID!, data: SettingsInput!, options: UpdateCmsEntryOptionsInput): SettingsResponse
    updateSettingsRevisionDescription(revision: ID!, revisionDescription: String): SettingsResponse
    createSettingsFrom(revision: ID!, data: SettingsInput, options: CreateRevisionCmsEntryOptionsInput): SettingsResponse
    publishSettings(revision: ID!): SettingsResponse
    unpublishSettings(revision: ID!): SettingsResponse
    deleteSettings(revision: ID!, options: CmsDeleteEntryOptions): CmsDeleteResponse
}
```

- `getSettingsLatest`: the latest revision. Creates the entry if missing. The admin uses it for the
  first load.
- `getSettingsRevision`: one revision by id.
- `getSettingsRevisions`, `updateSettings`, `updateSettingsRevisionDescription`,
  `createSettingsFrom`, `publishSettings`, `unpublishSettings`, `deleteSettings`: the same
  signatures as the regular manage SDL (`createManageSDL.ts:213-238`), so the admin editor gateways
  work unchanged. `meta` is emitted only in the manage SDL, not in the read string shared with
  read and preview.
- `SettingsArrayResponse` copies the regular `<Model>ArrayResponse`.
- Not emitted: `list`, `create`, `duplicate`, `move`, `restoreFromBin`, `deleteMultiple`,
  `validate`, `republish`. The manage `getSettings` without arguments is removed.

### Breaking changes (release notes)

- Manage `getSettings` (no arguments) is removed. Use `getSettingsLatest`.
- Manage `updateSettings` requires `revision`. For untagged singletons it is `${entryId}#0001`, the
  `id` returned by `getSettingsLatest`.
- Read and preview `getSettings` keep their signature. Preview now returns the latest revision
  instead of `#0001`, which is the same for untagged singletons.

We expect no clients to call the manage singleton operations outside the Webiny admin.

## Backend rules

### Singleton id

One helper, `createSingletonEntryId(model)`, derives `entryId` from the modelId. Every singleton use
case uses it.

### Revision checks

Every singleton operation that takes a `revision` (or `id` for `getSettingsRevisions`) checks it:

1. It belongs to the singleton: it starts with `${entryId}#` (or equals `entryId` for
   `getSettingsRevisions`). Otherwise `EntryNotFoundError`.
2. Untagged model: only `${entryId}#0001` is allowed. Otherwise
   `EntryValidationError("Model does not support revisions.")`.

### Untagged models

`publishSettings`, `unpublishSettings`, `createSettingsFrom` and `deleteSettings` fail with
`EntryValidationError("Model does not support publishing.")` for untagged models.
`getSettingsLatest`, `getSettingsRevision(#0001)`, `getSettingsRevisions`, `updateSettings(#0001)`
and `updateSettingsRevisionDescription(#0001)` work.

### Locked revisions

`updateSettings` on a locked (published) revision fails with `EntryLockedError`, as for regular
entries (`UpdateEntryUseCase.ts:47`). To change a published singleton, the client calls
`createSettingsFrom` and updates the new revision. Only internal code (for example
`UpdateEntrySystem`) changes a locked revision.

### Delete

- The whole singleton entry cannot be deleted. `deleteSettings` with an id without a version fails.
  `DeleteEntryUseCase` and `DeleteMultipleEntries` reject singleton models.
- Revision `#0001` cannot be deleted.
- The published revision cannot be deleted. Unpublish first.
- Any other revision can be deleted.

### Use cases

Singleton use cases resolve the singleton `entryId`, run the checks above, and delegate to the
generic use cases. One use case per file.

| Singleton use case | Delegates to |
|---|---|
| `GetLatestSingletonEntryUseCase` (manage, preview) | `GetLatestRevisionByEntryId`; creates with `CreateEntry` (`skipValidation: true`) if missing |
| `GetPublishedSingletonEntryUseCase` (read) | tagged: `GetPublishedRevisionByEntryId`, empty values if none; untagged: `#0001` via `GetRevisionById`; creates if missing |
| `GetSingletonEntryRevisionUseCase` | `GetRevisionById` |
| `ListSingletonEntryRevisionsUseCase` | `GetRevisionsByEntryId` |
| `UpdateSingletonEntryUseCase` (changed: takes `revision`) | `UpdateEntry` |
| `UpdateSingletonEntryRevisionDescriptionUseCase` | `UpdateRevisionDescription` |
| `CreateSingletonEntryRevisionFromUseCase` | `CreateEntryRevisionFrom` |
| `PublishSingletonEntryUseCase` | `PublishEntry` |
| `UnpublishSingletonEntryUseCase` | `UnpublishEntry` |
| `DeleteSingletonEntryRevisionUseCase` | `DeleteEntryRevision` |

`GetSingletonEntryUseCase` is replaced by the two get use cases above.

The generic use cases also guard singletons, because other packages call them from code, not
through GraphQL:

- `PublishEntry`, `UnpublishEntry`, `CreateEntryRevisionFrom`: reject untagged singletons.
- `DeleteEntryRevision`: rejects `#0001` and the published revision of a singleton.
- `DeleteEntry`, `DeleteMultipleEntries`: reject singletons.

### Access control

Add the singleton exemption from the entry-level owner check to `PublishEntryUseCase.ts:46`,
`UnpublishEntryUseCase.ts:54`, `CreateEntryRevisionFromUseCase.ts:54,75` and
`DeleteEntryRevisionUseCase.ts:64`, using `isSingletonModel`. Model-level checks (`pw: "p"`,
`pw: "u"`, `rwd: "w"`, `rwd: "d"`) stay.

### Events

The generic use cases fire the normal entry events for publish, unpublish, revision create and
revision delete. Webhooks, audit logs and search see singleton entries like any other entry.
Consumers that must tell them apart use `isSingletonModel(model)`.

## Admin (`packages/app-headless-cms/src`)

One editor for every singleton, built from the regular editor.

- Split `presentation/contentEntries/views/ContentEntryFormView.tsx` into:
  - an editor body that takes `entryId`, `modelName` and an optional `onBack`, and
  - the list adapter, which reads them from the list presenter as today
    (`ContentEntryFormView.tsx:24-41`).
- New `SingletonEditorView`: provides `ModelProvider` and `ContentEntryEditorWithConfig` (as
  `ListView.tsx:26-28` does), reads `route.params.id`, and without it loads the entry with
  `getSettingsLatest`. Renders the editor body without a back button, list, folders, breadcrumbs or
  "New entry". Revision switching keeps working through `route.params.id`
  (`RevisionSelector.tsx:55`, `RevisionListItem.tsx:106`, `OlderRevisionAlert.tsx:29`,
  `CreateNewRevisionButton.tsx:38`).
- `ModelLoader.tsx:23` renders `SingletonEditorView` for every singleton model.
- Delete: `SingleEntryView`, `SingleEntryLayout`, `presentation/contentEntries/singleEntry/` and
  `features/contentEntry/singletonEntry/`.
- Gateways: the editor gateways work unchanged, except loading:
  - first load: a gateway for `getSettingsLatest`;
  - a revision: a singleton variant of `GetEntryGateway` (`features/contentEntry/getEntry/GetEntryGateway.ts:32`)
    that calls `getSettingsRevision(revision)`, registered through DI for singleton models.
- `useIsModelPublishable` uses `isPublishingEnabled(model)`. This hides publish and revision actions
  for untagged singletons in the shared editor.
- Guards:
  - `IsNotSingletonModel` wrapper (in the style of `admin/components/IsModelPublishable.tsx`)
    around `DeleteEntryMenuItem` (`ContentEntriesModule.tsx:183`).
  - Next to `canDelete(revision)` in `RevisionListItem.tsx:256`: block `#0001` and the published
    revision of a singleton.
- No custom styling; reuse the editor's components.

## Workflows

Singletons stay excluded from workflows (`ListCmsEntryWorkflowModelsUseCase.ts:101`,
`isReviewableModel.ts:8`). Whether to include them later is undecided.

Gap to close: `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.ts`
has no `isReviewableModel` guard. Add an early return for singletons.

## Phase 2: scheduled publishing

Same PR, after phase 1. In phase 1 the scheduler UI is not hidden: its "Schedule" menu item
(`packages/app-headless-cms-scheduler/src/components/Editor/EditorConfig.tsx:11`, gated by
`IsModelPublishable`) appears for tagged singletons and may not work until phase 2.

Phase 2 scope, to be designed after phase 1:

- Scheduling publish and unpublish of a tagged singleton revision from the singleton editor.
- `api-headless-cms-scheduler` `SchedulePublishEntryUseCase.ts:28` and
  `ScheduleUnpublishEntryUseCase.ts:28` run only a model-level check today. Add the
  `isPublishingEnabled` check, which also closes the existing gap for `$publishing:false` models.
- The scheduled action runs `PublishEntry` / `UnpublishEntry`, so the singleton rules above apply.

## Tests

- Use case tests for each singleton use case on DDB, DDB-ES, SQLite (`api-headless-cms-sql`) and
  Postgres (`api-headless-cms-pg`).
- Read: tagged returns published; tagged with nothing published returns empty values; untagged
  returns `#0001`; creates if missing.
- Preview: returns latest; creates if missing.
- Manage: `getSettingsLatest` creates if missing; `getSettingsRevision` returns the revision.
- Revision checks: foreign revision fails with `EntryNotFoundError`; untagged with `#0002` fails
  with `EntryValidationError`.
- Untagged: publish, unpublish, create-from and delete fail; get and update of `#0001` work.
- Update of a locked revision fails with `EntryLockedError`.
- Delete: whole entry, `#0001` and the published revision fail; other revisions succeed.
- A user with "own entries" permission can publish, unpublish, create and delete revisions of a
  singleton created by another user.
- Existing `#0001` singleton works with no migration; adding the tag makes read return empty values
  until publish.
- Read and preview SDL have no `meta` and no mutations.
- Admin: `SingletonEditorView` loads latest, switches revisions by route, hides publish actions for
  untagged models, hides whole-entry delete, blocks `#0001` and published revision delete.
- Phase 2: scheduling tests, defined with the phase 2 design.
