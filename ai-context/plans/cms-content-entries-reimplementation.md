# Plan: CMS Content Entries Reimplementation

> Source PRD: `ai-context/prds/cms-content-entries-reimplementation.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Data fetching**: `CmsGraphQLClient` abstraction replaces ApolloClient. Gateways build model-specific GraphQL queries (same as current app-headless-cms) and execute via `CmsGraphQLClient`. No SDK changes needed.
- **Feature pattern**: Every operation follows Gateway → Repository → UseCase, each registered via `createFeature()` + `createAbstraction()` / `createImplementation()`. Gateways are singletons, Repositories are singletons (own cache references), UseCases are transient.
- **Caching**: Shared `ContentEntriesListCache` (singleton `ListCache<ContentEntry>`, MobX observable). All mutating repositories update the same cache instance.
- **Form rendering**: FormModel from `app-admin/features/formModel`. CMS models are mapped to `FormModelConfig` at runtime. CMS provides NO renderers or rendering logic — only a mapping layer.
- **Field type extensibility**: `CmsFormModelBuilder` uses a DI registry of `IFieldTypeMapper`. Custom CMS field types register their own mapper. Unknown types fall back to passthrough.
- **Presenters**: MobX `makeAutoObservable` classes exposing `vm` (computed) and `actions`. Zero route awareness.
- **Route-agnostic mounting**: `ContentEntriesView` accepts `modelId` as a prop. Optional `urlSync` adapter bridges presenter state ↔ URL params.
- **ACO integration**: `FoldersFeature` and `FolderTreePresenterFeature` from `@webiny/app-aco` registered in scoped child container (same as File Manager).
- **Configurable components**: `ContentEntryListConfig` and `ContentEntryEditorConfig` preserved as-is.
- **Reference fields**: New `CmsRefFieldType` registered as a FormModel `IFieldTypeFactory` from the CMS package. Six ref renderers ported to `createFieldRenderer()` format.

---

## [x] Phase 1: Headless Features

**User stories**: 3, 4, 7

### What to build

All content entry Gateway/Repository/UseCase features under `packages/app-headless-cms/src/features/contentEntry/`. Each feature has: `abstractions.ts`, Gateway implementation, Repository implementation, UseCase implementation, `feature.ts`.

Shared infrastructure:

- `ContentEntriesListCache` — singleton `ListCache<ContentEntry>` shared across all CRUD features
- `ContentEntryFieldsProvider` — derives GraphQL field selection strings from a `CmsModel` definition

CRUD features (each updates the shared cache appropriately):

- `getEntry` — fetches single entry, updates cache item
- `listEntries` — paginated list, populates cache
- `createEntry` — creates entry, adds to cache
- `updateEntry` — updates revision, updates cache item
- `publishEntry` — publishes revision, updates cache status
- `unpublishEntry` — unpublishes revision, updates cache status
- `deleteEntry` — deletes entry/revision, removes from cache
- `createRevisionFrom` — creates revision from existing, adds to cache
- `listRevisions` — lists revisions of an entry (standalone, no shared cache)

Singleton features (no shared cache):

- `getSingletonEntry` — fetches singleton entry
- `updateSingletonEntry` — updates singleton entry

Bulk action features (batch cache operations):

- `bulkPublish` — publishes multiple entries, batch cache status update
- `bulkUnpublish` — unpublishes multiple entries, batch cache status update
- `bulkMove` — moves entries to folder, batch cache location update
- `bulkDelete` — deletes multiple entries, batch cache removal

### Acceptance criteria

- [ ] Each feature registers in a DI container via `createFeature()` with `register()` / `resolve()`
- [ ] Gateways call `CmsGraphQLClient` (not Apollo directly, not raw fetch)
- [ ] Repositories update `ContentEntriesListCache` after mutations (verified by reading cache state in tests)
- [ ] UseCases return `{ success: true, data }` or `{ success: false, error }` — no thrown exceptions
- [ ] `ContentEntryFieldsProvider` produces correct field selection for any `CmsModel` definition
- [ ] Unit tests for each UseCase (mock Gateway, verify cache state after operation)
- [ ] All features can be registered in a container and resolved without errors

---

## [x] Phase 2: CmsModel → FormModel Mapping

**User stories**: 2, 5, 10, 12, 13, 14, 15

### What to build

The mapping layer that converts any `CmsModel` into a `FormModelConfig` for `FormModelFactory.create()`. This is the bridge between CMS's dynamic model definitions and FormModel's declarative form system.

**CmsFormModelBuilder** — the orchestrator. Takes a `CmsModel`, iterates its fields, and uses the field type mapper registry to produce `IFieldBuilder` instances. Produces both the `fields` config and the `layout` config.

**IFieldTypeMapper registry** — extensible via DI. Each mapper handles one CMS field type. Built-in mappers cover: text, long-text, number, boolean, datetime, file, rich-text, object (recursive children), dynamicZone (templates), json, ref. Unknown types fall back to passthrough.

**CmsLayoutMapper** — converts CMS 2D layout arrays (`CmsEditorFieldsLayout`) to FormModel layout nodes: rows, tabs (with nested layouts per tab), separators, alerts, nested object layouts.

**CmsValidationMapper** — converts CMS validator arrays (`{ name, message, settings }[]`) to Zod schemas on field builders: required, minLength, maxLength, pattern, gte, lte, date comparisons.

**CmsRendererMap** — static mapping of CMS renderer names to FormModel renderer names (e.g., `"text-input"` → `"textInput"`, `"boolean-input"` → `"switch"`).

**CmsAccessControlRuleEvaluator** — implements `IRuleEvaluator` for CMS `type: "accessControl"` rules (the `type: "condition"` rules are already handled by FormModel's built-in `ConditionRuleEvaluator`).

**CmsRefFieldType** — new `IFieldTypeFactory` for reference fields. Stores ref config (allowed models) in `rendererSettings`. Value shape: `{ id, modelId }` or array.

**Reference field renderers** — 6 renderers ported from CMS plugin format to `createFieldRenderer()`:

- Autocomplete single/multi
- Simple (radio/checkbox) single/multi
- Detailed (card) single/multi

### Acceptance criteria

- [ ] `CmsFormModelBuilder.build(model)` produces a valid `FormModelConfig` for any `CmsModel`
- [ ] Every built-in CMS field type (text, long-text, number, boolean, datetime, file, rich-text, object, dynamicZone, ref, json) maps to the correct FormModel field type
- [ ] CMS renderer names map to FormModel renderer names — `field.renderer.name` in the model produces the correct renderer in the FormModel
- [ ] CMS 2D layout arrays produce correct FormModel layout nodes (rows, tabs with nested layouts, separators, alerts)
- [ ] CMS validation rules produce correct Zod schemas (required, minLength, maxLength, pattern, gte, lte)
- [ ] CMS predefined values (`field.predefinedValues.enabled`) produce `.options()` on the field builder
- [ ] CMS field rules (`FieldRule[]`) map to FormModel `IRule[]` — condition rules work via existing evaluator, access control rules work via new evaluator
- [ ] Object fields with children are recursively mapped (including nested layouts)
- [ ] Dynamic zone fields produce correct FormModel templates
- [ ] Custom field types can register an `IFieldTypeMapper` via DI and get picked up by the builder
- [ ] Unknown field types fall back to passthrough renderer without errors
- [ ] `CmsRefFieldType` registers as a FormModel field type, ref renderers render correctly
- [ ] Extensive unit tests for the builder covering all field types, layout combinations, validation rules, and edge cases

---

## [ ] Phase 3: Presenters

**User stories**: 6, 8, 9

### What to build

MobX-based presenters that compose features and expose observable ViewModels. No React, no routes, no UI — pure state machines.

**ContentEntriesPresenter** (list):

- Composes `ListPresenter<ContentEntry>` (from `app-admin`) + `FolderTreePresenter` (from `app-aco`)
- `ContentEntriesDataSource` implements `IDataSource<ContentEntry>`, bridges ListPresenter's query interface to `ListEntriesUseCase`. Handles CMS-specific where-clause building (folder filtering, search, sort).
- Init: `presenter.init({ modelId, initialFolderId? })` — loads model, sets up data source, initializes child presenters
- VM: `{ model, list, folders, permissions, searchPlaceholder, selectedEntryId, showingEntry }`
- Actions: `{ search, filter, sort, selectFolder, selectEntry, deselectEntry, bulkPublish, bulkUnpublish, bulkMove, bulkDelete }`
- Entry selection is an observable state change, not route navigation
- Dispose: cleans up MobX reactions

**ContentEntryFormPresenter** (form):

- Owned by the list presenter (or standalone for direct entry editing)
- Loads or creates entry via UseCases
- Constructs FormModel from CmsModel via `CmsFormModelBuilder`, populates with entry data
- VM: `{ loading, saving, entry, form (IFormVM), revisions, activeTab, canSave, canPublish, canUnpublish, canDelete, canCreateRevision, isNewEntry, isDirty, showEmptyView }`
- Actions: `{ save, publish, unpublish, delete, createRevision, switchRevision, setActiveTab }`
- Dirty state delegates to `formModel.isDirty`
- Navigation guard support

**SingletonEntryPresenter**:

- Simplified form presenter — no revisions, no create/delete
- Auto-loads singleton entry on init
- VM: `{ loading, saving, form (IFormVM), canSave, isDirty }`
- Actions: `{ save }`

### Acceptance criteria

- [ ] `ContentEntriesPresenter.init({ modelId })` loads the model, initializes ListPresenter + FolderTreePresenter, and exposes a valid VM
- [ ] List pagination works: initial load, load more, sort change triggers re-query
- [ ] Folder selection updates the DataSource filter and triggers re-query
- [ ] Search updates the DataSource and triggers re-query with debounce
- [ ] `selectEntry(id)` updates `vm.selectedEntryId` and `vm.showingEntry`
- [ ] Bulk actions delegate to UseCase features and update cache (reflected in `vm.list`)
- [ ] `ContentEntryFormPresenter` loads entry, builds FormModel, populates data, exposes valid `vm.form`
- [ ] Save action: calls `formModel.submit()`, on success calls UpdateEntryUseCase, updates cache
- [ ] Publish/unpublish actions delegate to UseCases, update cache and VM
- [ ] Delete action delegates to UseCase, updates cache, signals list to deselect
- [ ] Create revision delegates to UseCase, reloads form with new revision
- [ ] `vm.isDirty` reflects `formModel.isDirty`
- [ ] `SingletonEntryPresenter.init({ modelId })` auto-loads singleton, builds FormModel, save works
- [ ] `dispose()` cleans up reactions without leaks
- [ ] Unit tests for each presenter (mock UseCases, verify VM state transitions)

---

## [ ] Phase 4: Views + Integration

**User stories**: 1, 8, 11, 16, 17, 18, 19, 20

### What to build

React observer components that mount presenters and render UI. This is where the scoped DI container is created, features are registered, and the presenter lifecycle is managed.

**ContentEntriesView**:

- Accepts `modelId` prop (+ optional `urlSync` adapter)
- Creates scoped child container via `useContainer().createChildContainer()`
- Registers all features: SharedCacheFeature, FoldersFeature, FolderTreePresenterFeature, all CRUD features, bulk features, ContentEntriesPresenterFeature
- Wraps with `DiContainerProvider`
- Inner observer resolves presenter via `useFeature()`, calls `init({ modelId })` / `dispose()`
- Renders list layout: folder tree sidebar + entry table + optional entry form panel
- Reads from `ContentEntryListConfig` / `ContentEntryEditorConfig` for configurable components (table columns, actions, filters, etc.)

**ContentEntryFormView**:

- Renders `<FormView form={vm.form} />` from `app-admin`
- Header/action bar driven by presenter VM (save, publish, unpublish, delete buttons)
- Tab switching: Content tab (FormView) / Revisions tab (revision list)
- Revision selector in header

**SingletonEntryView**:

- Simplified form view — no tabs, no revision management
- Save button from presenter VM

**URL sync adapter** (for default CMS route):

- Thin bidirectional bridge: presenter `selectedEntryId` ↔ URL `entryId` param, presenter `folderId` ↔ URL `folderId` param
- Not used when mounting on custom routes

**Configurable component integration**:

- `ContentEntryListConfig` provides table columns, bulk actions, filters, folder actions, entry actions
- `ContentEntryEditorConfig` provides header actions, validation indicators
- Views read from config context and render accordingly

### Acceptance criteria

- [ ] `<ContentEntriesView modelId="someModel" />` renders a working entry list with folder tree, search, filters, pagination
- [ ] Selecting an entry in the list opens the form panel with all fields rendered via FormView
- [ ] All field types render correctly (text, number, boolean, datetime, file, rich-text, object, dynamicZone, ref)
- [ ] Save, publish, unpublish, delete work end-to-end (UI → presenter → UseCase → SDK → cache → UI update)
- [ ] Revision management works: create revision, switch between revisions, revision list displays
- [ ] Bulk actions work: select multiple entries, publish/unpublish/move/delete
- [ ] Folder navigation works: click folder → list updates
- [ ] Search and filtering work
- [ ] Dirty state guard prevents navigation away from unsaved changes
- [ ] Singleton entries work via `SingletonEntryView`
- [ ] Configurable components render (custom columns, actions, filters registered via `ContentEntryListConfig` / `ContentEntryEditorConfig`)
- [ ] Route-agnostic: mounting on a custom route (e.g., `/tenant-manager`) with just `modelId` prop works identically to the CMS route
- [ ] URL sync adapter works on the default CMS route (deep-linking to entry/folder)
- [ ] No ApolloClient usage in any new code

---

## [ ] Phase 5: Migrate Config Components off ACO Hooks

**User stories**: 16, 17, 19

### What to build

The config-registered table cells, entry actions, and bulk actions in `ContentEntriesModule.tsx` depend on old ACO hooks (`useRecords`, `useNavigateFolder`, `useMoveToFolderDialog`) and old CMS hooks (`useContentEntriesList`, `useContentEntry`). These must be rewritten to use the new presenter-based hooks instead.

**Components to migrate:**

Table cells (`admin/components/ContentEntries/Table/Cells/`):

- `CellName` — uses `useNavigateFolder`, `useContentEntriesList` (for `getEntryEditUrl`)
- Other cells (`CellAuthor`, `CellCreated`, `CellModified`, `CellStatus`, `CellLive`, `CellActions`) — check each for old hook usage

Table entry actions (`admin/components/ContentEntries/Table/Actions/`):

- `EditEntry` — uses `useContentEntriesList`
- `ChangeEntryStatus` — uses `useContentEntry`
- `DeleteEntry` — uses `useContentEntry`
- `MoveEntry` — likely uses `useRecords` / `useMoveToFolderDialog`

Bulk actions (`admin/components/ContentEntries/BulkActions/`):

- `ActionPublish` — uses `useRecords` (`updateRecordInCache`)
- `ActionUnpublish` — uses `useRecords` (`updateRecordInCache`)
- `ActionMove` — uses `useRecords` (`moveRecord`), `useNavigateFolder`, `useMoveToFolderDialog`
- `ActionDelete` — uses `useRecords` (`removeRecordFromCache`)

**Migration strategy:**

- Replace `useRecords().updateRecordInCache` / `removeRecordFromCache` / `moveRecord` with presenter actions (cache is now managed by the feature layer automatically)
- Replace `useNavigateFolder()` with `useContentEntriesPresenter().actions.folders.selectFolder`
- Replace `useContentEntriesList()` with `useContentEntriesPresenter()`
- Replace `useContentEntry()` with `useContentEntryFormPresenter()`
- Replace `useMoveToFolderDialog()` with presenter-driven move action

### Acceptance criteria

- [ ] No `useRecords` calls remain in content entry components
- [ ] No `useNavigateFolder` calls remain in content entry components
- [ ] No `useContentEntriesList` calls remain in content entry components
- [ ] No `useContentEntry` calls remain in content entry components
- [ ] No `useMoveToFolderDialog` calls remain in content entry components
- [ ] Table renders with all columns (name, author, created, modified, status, live, actions)
- [ ] Bulk actions work (publish, unpublish, move, delete)
- [ ] Entry actions work (edit, change status, move, delete)
- [ ] Folder navigation works via cell click

---

## [ ] Phase 6: Cleanup

**User stories**: all (regression safety)

### What to build

Remove all old code that has been replaced by the new architecture. Verify no regressions.

Files to delete:

- Old context providers: `ContentEntryContext.tsx`, `SingletonContentEntryContext.tsx`, `ContentEntriesContext.tsx`
- Old hooks: `useContentEntriesList.tsx`, `useContentEntry.ts`, `useSingletonContentEntry.ts`
- Old form stack: `ContentEntryFormProvider.tsx`, `DefaultLayout.tsx`
- All ~26 plugin-based field renderers in `admin/plugins/fieldRenderers/`
- Apollo wrapper hooks: `useApolloClient.ts`, `useQuery.ts`, `useMutation.ts` (if no other consumers remain)

Files to keep with updated imports:

- `ContentEntriesModule.tsx` — configurable component registrations
- Config system (`ContentEntryListConfig`, `ContentEntryEditorConfig`)
- `FullScreenContentEntry` — rewired to form presenter

### Acceptance criteria

- [ ] No ApolloClient imports remain in content entry code paths
- [ ] No deleted file is imported anywhere in the codebase (build succeeds)
- [ ] All existing configurable component registrations still work
- [ ] Manual test: create a content model with every field type and every renderer variant — create, edit, publish, unpublish entries
- [ ] Manual test: folder navigation and search
- [ ] Manual test: singleton entries
- [ ] Manual test: dynamic zones and nested objects
- [ ] Manual test: bulk actions
- [ ] Manual test: mount on a custom route with just `modelId` — verify identical behavior
- [ ] `yarn lint` passes
- [ ] `yarn test packages/app-headless-cms` passes
