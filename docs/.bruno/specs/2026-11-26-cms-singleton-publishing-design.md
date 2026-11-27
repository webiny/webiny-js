# CMS singleton entries: publishing and revisions

Status: draft
Date: 2026-11-26
Release: 6.6, one PR. Phase 1 and phase 2 (scheduling) ship together.

## Goal

A singleton model (tag `singleEntry`) can opt in to the regular entry lifecycle: draft, publish,
unpublish, revisions, and (phase 2) scheduled publishing. A customer uses a singleton as a global
site setting and needs changes to go live on a schedule. Singletons without the opt-in keep working
as today: one revision, `#0001`, never published (unless it was published while the model was
tagged).

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
- Admin: the "New model" dialog has an "Enable publishing" checkbox, shown only while "Single entry
  model" is checked; it adds `$publishing:true`. The option exists only at creation. The model
  settings do not offer it, so publishing cannot be changed in the admin later. Code-defined
  models set the tag in code.
- Tag constants, next to `CMS_MODEL_SINGLETON_TAG`: `CMS_MODEL_PUBLISHING_ENABLED_TAG = "$publishing:true"`
  and `CMS_MODEL_PUBLISHING_DISABLED_TAG = "$publishing:false"`. API: `constants.ts`. Admin:
  `@webiny/app-headless-cms-common` constants (where `CMS_MODEL_SINGLETON_TAG` already lives, see
  `isReviewableModel.ts:1`). The literal `"$publishing:false"` in `useIsModelPublishable.ts:7`,
  `SaveContentButton.tsx:24`, `CreateNewRevisionButton.tsx:28` and `isBindableModel.ts:4` is replaced
  by the constant. `isBindableModel` keeps its logic (only the constant changes); singletons stay
  excluded from workflows by `ListCmsEntryWorkflowModelsUseCase.ts:101`.
- One shared helper encodes both rules: `isPublishingEnabled(model)`.
  - API: `isSingletonModel` moves out of `entryOwnerAccess.ts:15` into one canonical module, and
    both helpers are exported from `exports/api/cms/model.ts`. `entryOwnerAccess.ts` imports it,
    and the private copy in `ListCmsEntryWorkflowModelsUseCase.ts:26` is replaced by the export.
  - Admin: `isPublishingEnabled` in `@webiny/app-headless-cms-common`. `useIsModelPublishable`,
    `SaveContentButton` and `CreateNewRevisionButton` use it.
- Adding the tag to an existing singleton: the read API returns empty values until an editor
  publishes (see read below). Exception: if `#0001` was published during an earlier tagged period,
  it is still published, and read returns its current values, including edits made while untagged
  (see Locked revisions). The docs say to publish right after adding the tag. Removing the tag:
  the read API returns `#0001` again; later revisions stay in storage but are not reachable. The tag
  cannot be guarded, because code-defined models change it without an API call.
- If `#0001` was published while tagged, it stays locked after the tag is removed. Untagged models
  skip the lock check on `#0001` (see Locked revisions), so the singleton stays editable.

## GraphQL

### Schema generation

`createSingularSDL.ts` today builds one string with the types plus `extend type Query { get<S> }`
(lines 59-92) and appends manage-only parts to it (lines 93-124). It is restructured into:

- shared types: `<S>Values`, `<S>`, field type defs, `<S>ListWhereInput`, `<S>Response`;
- read and preview: `extend type Query { get<S> }`;
- manage: `<S>Meta`, `extend type <S> { meta }`, `<S>ArrayResponse` (a copy of the regular one,
  `createManageSDL.ts:173`, because the regular manage SDL is not emitted for singletons), input
  types, and the manage Query and Mutation blocks below. The manage block has no `get<S>` and
  replaces the old `update<S>(data, options)`.

Singleton models with no fields (`model.fields.length === 0`) have no API, as today. Both
`createSingularSDL.ts` (which checks `inputFields.length === 0` at :30 today) and
`createSingularResolvers.ts:26-31` use this one predicate, so a model whose fields render no input
still gets the full API (input and value types fall back to `_empty: String`). Layout cells are not
stored in `model.fields`, so a layout-only model has no fields. The admin uses the same predicate.

`createSingularResolvers.ts` follows the same split. Resolvers:

| Endpoint | Field | Use case |
|---|---|---|
| read | `get<S>` | `GetPublishedSingletonEntryUseCase` |
| preview | `get<S>` | `GetLatestSingletonEntryUseCase` |
| manage | `get<S>Latest` | `GetLatestSingletonEntryUseCase` |
| manage | `get<S>Revision` | `GetSingletonEntryRevisionUseCase` |
| manage | `get<S>Revisions` | `ListSingletonEntryRevisionsUseCase` |
| manage | `update<S>` | `UpdateSingletonEntryUseCase` |
| manage | `update<S>RevisionDescription` | `UpdateSingletonEntryRevisionDescriptionUseCase` |
| manage | `create<S>From` | `CreateSingletonEntryRevisionFromUseCase` |
| manage | `publish<S>` | `PublishSingletonEntryUseCase` |
| manage | `unpublish<S>` | `UnpublishSingletonEntryUseCase` |
| manage | `delete<S>` | `DeleteSingletonEntryRevisionUseCase` |

Change: `schemaPlugins.ts:52` collapses preview to `read` today
(`type === "manage" ? "manage" : "read"`). It changes to pass the real endpoint (`read` or
`preview`) to the singular resolvers, only to choose the use case. Field resolvers keep `endpointType: "read"` for preview, as
`createPreviewResolvers.ts:19-21` does for regular models, and the SDL keeps rendering preview
fields as `read`.

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
- `deleteSettings` keeps `options` for signature parity. As in the regular `resolveDelete.ts:23-25`
  for a revision id, it is ignored.
- Not emitted: `list`, `create`, `duplicate`, `move`, `restoreFromBin`, `deleteMultiple`,
  `validate`, `republish`. The manage `getSettings` without arguments is removed.

### Breaking changes (release notes)

- Manage `getSettings` (no arguments) is removed. Use `getSettingsLatest`.
- Manage `updateSettings` requires `revision`. For untagged singletons it is `${entryId}#0001`, the
  `id` returned by `getSettingsLatest`.
- Read and preview `getSettings` keep their signature. Preview now returns the latest revision
  instead of `#0001`, which is the same for untagged singletons.

- Public exports (`@webiny/api-headless-cms/exports/api/cms/entry.js` and `webiny/api/cms/entry`):
  `GetSingletonEntryUseCase` is removed; use `GetLatestSingletonEntryUseCase` or
  `GetPublishedSingletonEntryUseCase`. `UpdateSingletonEntryUseCase.execute` takes a `revision`.

We expect no clients to call the manage singleton operations outside the Webiny admin.

## Backend rules

### Singleton id

One helper, `createSingletonEntryId(model)`, derives `entryId` from the modelId. Every singleton use
case uses it.

### Revision checks

Every singleton operation that takes a `revision` (or `id` for `getSettingsRevisions`) runs the
checks in "Order of checks" below.

- A revision belongs to the singleton when `parseIdentifier(revision).id === entryId`.
- `getSettingsRevisions(id)` accepts the entry id or any revision id of the singleton, because the
  admin passes the route id, which is a revision id (`ContentEntryFormView.tsx:47`,
  `RevisionsListPresenter.ts:101-110`). The use case calls `GetRevisionsByEntryId` with the parsed
  entry id.
- For an untagged model, `getSettingsRevisions` returns only `#0001`. Later revisions left in
  storage after removing the tag are not returned.

### Order of checks

Each singleton use case runs its checks in this order and stops at the first failure:

1. Revision (or id) belongs to the singleton, else `EntryNotFoundError`.
2. The value is a revision id (has a version). Not applied to `getSettingsRevisions`, which takes
   an entry id or a revision id. An id without a version fails with `EntryValidationError`:
   "Singleton entry cannot be deleted." for `deleteSettings`, "A revision id is required." for every
   other operation.
3. Untagged model and the operation needs publishing (publish, unpublish, create-from, delete),
   else `EntryValidationError("Model does not support publishing.")`.
4. Untagged model and the revision is not `#0001`, else
   `EntryValidationError("Model does not support revisions.")`. Not applied to
   `getSettingsRevisions`, which filters its result instead (see Revision checks).
5. Operation rules (locked revision, delete rules). For delete, the `#0001` rule is checked before
   the published-revision rule, so a published `#0001` fails with "The first revision of a singleton
   entry cannot be deleted."

So an untagged `deleteSettings(#0002)` fails with "does not support publishing", an untagged
`updateSettings(#0002)` with "does not support revisions", and `deleteSettings(entryId)` with
"Singleton entry cannot be deleted." on any singleton.

### Untagged models

`publishSettings`, `unpublishSettings`, `createSettingsFrom` and `deleteSettings` with a revision id
fail with `EntryValidationError("Model does not support publishing.")` for untagged models
(step 3 of Order of checks).
`getSettingsLatest`, `getSettingsRevision(#0001)`, `getSettingsRevisions`, `updateSettings(#0001)`
and `updateSettingsRevisionDescription(#0001)` work.

### Locked revisions

`updateSettings` on a locked (published) revision fails with `EntryLockedError`, as for regular
entries (`UpdateEntryUseCase.ts:47`). To change a published singleton, the client calls
`createSettingsFrom` and updates the new revision. Only internal code (for example
`UpdateEntrySystem`) changes a locked revision.

Exception: on an untagged singleton, `updateSettings(#0001)` skips the lock check, so a `#0001` that
was published before the tag was removed stays editable. `UpdateEntryUseCase.ts:47` gets this
branch (`isSingletonModel(model) && !isPublishingEnabled(model)`). The update also rewrites the
published data of `#0001`: DDB writes the published record in the same batch when the revision is
published (`packages/api-headless-cms-ddb/src/operations/entry/DdbUpdateEntry.ts:53-54,78-83`), and
SQL storage keeps one row per revision with an `is_published` flag
(`packages/api-headless-cms-pg/src/operations/entry/PgUpdateEntry.ts:36-40`). The untagged read API
reads `#0001` through `GetRevisionById` either way. If the tag is added again later, read serves
these edited values as the published revision.

### Delete

A foreign revision or id fails with `EntryNotFoundError` (step 1). The rule-based failures below are
`EntryValidationError`:

- The whole singleton entry cannot be deleted. `deleteSettings` with an id without a version fails
  with "Singleton entry cannot be deleted." (step 2). `DeleteEntryUseCase` and
  `DeleteMultipleEntries` reject singleton models with the same message.
- Revision `#0001` cannot be deleted: "The first revision of a singleton entry cannot be deleted."
- The published revision cannot be deleted: "The published revision cannot be deleted. Unpublish it
  first."
- Any other revision of a tagged singleton can be deleted.

### Use cases

Singleton use cases resolve the singleton `entryId`, run the checks above, and delegate to the
generic use cases. One use case per file.

| Singleton use case | Delegates to |
|---|---|
| `GetLatestSingletonEntryUseCase` (manage, preview) | tagged: `GetLatestRevisionByEntryId`; untagged: `#0001` via `GetRevisionById`, so a leftover `#0002` is never returned; creates with `CreateEntry` (`skipValidation: true`) if missing |
| `GetPublishedSingletonEntryUseCase` (read) | tagged: `GetPublishedRevisionByEntryId`, empty values if none; untagged: `#0001` via `GetRevisionById`; creates if missing |
| `GetSingletonEntryRevisionUseCase` | `GetRevisionById` |
| `ListSingletonEntryRevisionsUseCase` | `GetRevisionsByEntryId` with the parsed entry id; untagged: keeps only `#0001` from the result |
| `UpdateSingletonEntryUseCase` (changed: takes `revision`) | `UpdateEntry` |
| `UpdateSingletonEntryRevisionDescriptionUseCase` | `UpdateRevisionDescription` |
| `CreateSingletonEntryRevisionFromUseCase` | `CreateEntryRevisionFrom` |
| `PublishSingletonEntryUseCase` | `PublishEntry` |
| `UnpublishSingletonEntryUseCase` | `UnpublishEntry` |
| `DeleteSingletonEntryRevisionUseCase` | `DeleteEntryRevision`, only with a revision id (step 2 rejects an entry id) |

`GetSingletonEntryUseCase` is replaced by the two get use cases above.

The generic use cases also guard singletons, because other packages call them from code, not
through GraphQL:

- `PublishEntry`, `UnpublishEntry`, `CreateEntryRevisionFrom`: reject untagged singletons.
- `DeleteEntryRevision`: rejects any revision of an untagged singleton ("does not support
  publishing"), and `#0001` and the published revision of a tagged singleton.
- `DeleteEntry`, `DeleteMultipleEntries`: reject singletons.

### Access control

Add the singleton exemption from the entry-level owner check to `PublishEntryUseCase.ts:46`,
`UnpublishEntryUseCase.ts:54`, `CreateEntryRevisionFromUseCase.ts:54,75`,
`DeleteEntryRevisionUseCase.ts:64` and `UpdateRevisionDescriptionUseCase.ts:48-56`, using `isSingletonModel`. Model-level checks (`pw: "p"`,
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
  `getSettingsLatest`, then replaces the route with that revision id, so revision switching starts
  from a route that has an id. Renders the editor body without a back button, list, folders or
  "New entry", **inside the admin layout**: the sidebar, breadcrumb and top bar stay visible. The
  regular editor body is a fixed full-screen overlay (`layout/Container.tsx`, `fixed z-overlay`)
  that relies on its back button; `Container` and `ScrollArea` take `fullScreen` (default `true`,
  regular editor unchanged) and `SingletonEditorView` passes `false`.
- Breadcrumb: `SingletonEditorBreadcrumbs` emits `Headless CMS › <model name>` (the same `cms` and
  `cms.model` entries as the list view's `ContentEntriesBreadcrumbs`), in every view state. Any
  user who can open a singleton can open the "Headless CMS" link: the models list needs a
  `cms.contentModel` permission, and loading a singleton already needs model read access. Revision switching keeps working through `route.params.id`
  (`actions/RevisionSelector.tsx:55`, `RevisionListItem.tsx:106`, `OlderRevisionAlert.tsx:29`,
  `actions/CreateNewRevisionButton.tsx:38`).
- `ModelLoader.tsx:23` renders `SingletonEditorView` for every singleton model. A singleton model
  with no fields has no API (see Schema generation), so `SingletonEditorView` shows an empty-state
  message ("This model has no fields.") and makes no request.
- The form presenter (`presentation/contentEntries/form/ContentEntryFormPresenter.ts`) also holds
  `CreateEntryUseCase` and `DeleteEntryUseCase`. For a singleton the entry always exists, so the
  create path (which sends `wbyAco_location`, line 167) never runs, and whole-entry delete is hidden
  by the guard below. No folder id is set.
- Delete: `SingleEntryView`, `SingleEntryLayout`, `presentation/contentEntries/singleEntry/` and
  `features/contentEntry/singletonEntry/`, and the registration in `ContentEntriesView.tsx:45`.
- Record locking: delete `packages/app-record-locking/src/presentation/entryLocking/SingleEntryPresenterDecorator.ts`
  and `SingleEntryContentDecorator.tsx` and their registrations (`feature.ts:13` for the presenter
  decorator). The
  editor is locked by the existing `ContentEntryFormPresenterDecorator.ts`, so singletons get the
  same locking as regular entries.
- Gateways: the editor gateways work unchanged, except loading:
  - first load: a gateway for `getSettingsLatest`;
  - a revision: a singleton variant of `GetEntryGateway` (query built at
    `features/contentEntry/getEntry/GetEntryGateway.ts:31-41`, implementation exported at `:61`)
    that calls `getSettingsRevision(revision)`, registered through DI for singleton models.
  - Both live in a new `features/contentEntry/singletonEditor/` folder (gateway, use case and
    feature per operation), replacing the deleted `features/contentEntry/singletonEntry/`.
- `useIsModelPublishable` uses `isPublishingEnabled(model)`. This hides publish and revision actions
  for untagged singletons in the shared editor.
- Guards:
  - `IsNotSingletonModel` wrapper (in the style of `admin/components/IsModelPublishable.tsx`)
    around `DeleteEntryMenuItem` (`ContentEntriesModule.tsx:183`).
  - Next to `canDelete(revision)` in `RevisionListItem.tsx:256`: block `#0001` and the published
    revision of a singleton.
- Save validation: Save sends `skipValidation` only when `isPublishingEnabled(model)`. An untagged
  singleton has no publish step, so Save validates, as for `$publishing:false` models and as the old
  `SingleEntryPresenter` did. A tagged singleton validates on publish.
- Locked save: the form presenter creates a new revision before saving a locked entry (private
  `saveEntry`, `ContentEntryFormPresenter.ts:381-384`). It does so only when
  `isPublishingEnabled(model)`, so an untagged singleton with a locked `#0001` is updated directly
  (see Locked revisions). `canCreateNewRevision` (`:113-114`) gets the same condition, so that
  entry shows Save, not "New revision".
- Load errors: `ContentEntryFormPresenter.loadRevision` gets a `loadError` view-model field, shown by
  the editor body. This applies to the regular editor too, where a failed load is an unhandled
  rejection today.
- Editor menu: an "Unpublish" item (`views/actions/UnpublishEntryMenuItem.tsx`) is in the header
  kebab while the open revision is published and the user has unpublish permission. It uses the
  revisions presenter's `unpublishRevision` (same confirmation and list refresh as the revisions
  drawer). It applies to regular models too; before, Unpublish existed only in the revisions drawer.
- "Compare revisions" (ai-powerups, `CmsCompareEntryRevisions/Extension.tsx`) is wrapped in
  `IsModelPublishable`: models without publishing (untagged singletons, `$publishing:false`) have
  only one revision.
- "New model" dialog (`presentation/newContentModel/NewContentModelPresenter.ts`):
  - "Enable publishing" switch, shown only while "Single entry model" is on; adds `$publishing:true`
    (see Opt-in).
  - "Plural API Name" is hidden while "Single entry model" is on, and otherwise required, max 100
    characters, with the API-name rules (`createApiNameSchema.ts`: UpperFirst camelCase, no
    reserved suffix, no duplicate). The form-model refactor (`c39b424b16`) had dropped both.
    "Singular API Name" keeps only `required` in the UI; the API validates its format.
  - API errors reach the dialog. Create and create-from now return the zod details
    (`ModelValidationError` with `data.invalidFields`); the admin `CmsModelError` keeps code and
    data; the presenter puts each invalid-field message under its field (`form.setErrors`) and
    anything else (duplicate name, reserved suffix) in a dialog `Alert`. Before, `save()` swallowed
    the error and the dialog did nothing.
  - Single entry models send the derived plural `<singular>Unused`. Its error is dropped when the
    singular already has one, and shown under "Singular API Name" when it is the only error.
- No custom styling; reuse the editor's components.

## Workflows

Singletons stay excluded from workflows (`ListCmsEntryWorkflowModelsUseCase.ts:101`,
`isReviewableModel.ts:8`). Whether to include them later is undecided.

Gap to close: `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.ts`
has no `isReviewableModel` guard. Add an early return for singletons. The form and revisions
decorators already return early for singletons (`isReviewableModel.ts:8`), and the API never binds
a singleton to a workflow, so no review exists for a singleton entry.

## Phase 2: scheduled publishing

Scheduling needed no singleton-specific code. The scheduler UI (gated by `IsModelPublishable`,
`packages/app-headless-cms-scheduler/src/components/Editor/EditorConfig.tsx:11`) shows "Schedule
publish" / "Schedule unpublish" for tagged singletons, and the scheduled action runs `PublishEntry`
/ `UnpublishEntry`, so the singleton rules above apply. Verified on a deployed project: a scheduled
publish of a draft singleton revision and a scheduled unpublish of the published revision both ran
at the set time, and the read API followed (published values, then empty values).

API guard. GraphQL `scheduler.scheduleAction` and `cancelScheduledAction` go through
`api-headless-cms-scheduler/src/features/NamespaceHandler/NamespaceHandler.ts`, not through
`SchedulePublishEntryUseCase` / `ScheduleUnpublishEntryUseCase` (those are only registered and
exported). The handler:

- rejects scheduling when `!isPublishingEnabled(model)` with
  `EntryValidationError("Model does not support publishing.")`. This blocks untagged singletons and
  closes the existing gap for `$publishing:false` models, which the UI hid but the API accepted;
- still allows **cancelling** on such models, so a schedule created before the tag was removed (or
  through the API before this guard) can be cancelled. api-scheduler's handler params get an
  optional `operation: "schedule" | "cancel"` (`api-scheduler/src/features/NamespaceHandler/abstractions.ts`);
  `CancelScheduledActionUseCase` passes `"cancel"`, and a missing value means `"schedule"`, so
  other handlers are unaffected;
- gives singletons the same owner exemption as publish: for `isSingletonModel(model)` it runs the
  model-level `canAccessEntry({ model, pw })` instead of the entry-level check.

The two use cases keep the same `isPublishingEnabled` guard, since they are public exports.

## Tests

- Use case tests for each singleton use case on DDB, DDB-ES, SQLite (`api-headless-cms-sql`) and
  Postgres (`api-headless-cms-pg`).
- Read: tagged returns published; tagged with nothing published returns empty values; untagged
  returns `#0001`; creates if missing.
- Preview: returns latest; creates if missing.
- Manage: `getSettingsLatest` creates if missing; `getSettingsRevision` returns the revision.
- Revision checks: foreign revision fails with `EntryNotFoundError`; untagged `updateSettings(#0002)`
  fails with "does not support revisions"; untagged `publishSettings(#0002)` fails with "does not
  support publishing".
- `getSettingsRevisions` accepts the entry id and a revision id; for an untagged model with a
  leftover `#0002` it returns only `#0001`.
- Untagged: publish, unpublish, create-from and delete fail; get and update of `#0001` work.
- Update of a locked revision fails with `EntryLockedError` on a tagged singleton.
- Untagged singleton with a locked (previously published) `#0001`: `updateSettings(#0001)` works and
  read returns the updated values. After the tag is added again, read returns the same values.
- Delete: whole entry, `#0001` and the published revision fail; other revisions succeed.
- A user with "own entries" permission can publish, unpublish, create and delete revisions of a
  singleton created by another user.
- Existing `#0001` singleton works with no migration; adding the tag makes read return empty values
  until publish.
- Read and preview SDL have no `meta` and no mutations.
- Admin: `SingletonEditorView` loads latest, switches revisions by route, hides publish actions for
  untagged models, hides whole-entry delete, blocks `#0001` and published revision delete.
- Untagged model with a leftover `#0002`: preview `getSettings` and `getSettingsLatest` return `#0001`.
- Delete errors match the messages in Delete.
- Admin: a singleton model with no fields shows "This model has no fields." and makes no request.
- Scheduler (through `ScheduleActionUseCase`, the GraphQL path): scheduling publish and unpublish
  fails with "Model does not support publishing." for an untagged singleton and a
  `$publishing:false` model; succeeds for a regular model and a publishing singleton; an
  own-entries user can schedule a singleton created by another identity; an existing schedule on a
  model without publishing can still be cancelled
  (`api-headless-cms-scheduler/__tests__/schedulePublishingDisabled.test.ts`).
- New model dialog: plural hidden for single entry, required and validated otherwise; API
  invalid-field errors under their field, other errors in the alert; derived plural error dropped or
  moved to the singular field (`NewContentModelPresenter.test.ts`).
- Editor kebab Unpublish item: shown for a published revision with permission only
  (`UnpublishEntryMenuItem.test.tsx`).
