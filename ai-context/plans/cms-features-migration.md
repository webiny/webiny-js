# Plan: Migrate CMS to Headless Features (Models + Entries)

> Source PRD: `ai-context/prds/cms-entries-refactor.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **GraphQL endpoint**: CMS-scoped client targets `${apiUrl}/cms/manage` via `CmsGraphQLClient` abstraction
- **Caching**: MobX-based `ListCache<T>` (from `@webiny/app-aco`) — one shared cache per domain (`ModelsCache`, `ModelGroupsCache`, `EntriesCache`, `RevisionsCache`)
- **Feature layering**: Each sub-feature follows `UseCase -> Repository -> Gateway` with its own gateway containing only the GQL operation it needs
- **Feature location**: `packages/app-headless-cms/src/features/`
- **DI pattern**: `createFeature` + `createAbstraction` from `@webiny/feature/admin`, resolved via `useFeature()` in React
- **Presentation layer**: Each headless feature gets a corresponding presentation hook in `src/presentation/{model|modelGroup|entry}/hooks/` (e.g., `useCreateModel`, `useListModelGroups`). Hooks wrap `useFeature()` and expose a simple API to React consumers. This keeps React concerns out of headless features (correcting the ACO pattern where hooks were co-located with features).
- **Entry queries**: Dynamic GQL generators from `@webiny/app-headless-cms-common` (`createReadQuery(model)`, etc.) — called inside each entry gateway
- **Test pattern**: Each sub-feature gets a unit test: create `Container`, register feature, replace gateway with mock, verify use case + cache behavior (see ACO `CreateFolder.test.ts` pattern)

---

## Phase 1: CMS GraphQL Client

**User stories**: Foundation for all subsequent phases — no direct user-facing behavior.

This is already implemented. CmsGraphQLClient can be imported from `~/features/graphQLClient/abstractions.ts` in `packages/app-headless-cms` package.

---

## Phase 2: Model Groups Feature + Consumer Migration

**User stories**: List, view, create, update, and delete content model groups. Groups appear in the sidebar menu and in model creation dialogs.

### What to build

The complete model groups domain as a vertical slice: shared `ModelGroupsCache` (MobX `ListCache<CmsModelGroup>`), all 5 sub-features (list, get, create, update, delete) each with their own gateway, the composite `ModelGroupFeature`, AND migration of all 9 group consumer files. This is the least impactful domain (fewest consumers, no cross-domain dependencies) and serves as the proof-of-concept for the pattern.

Consumer migration includes: `ContentModelGroupsDataList`, `ContentModelGroupsForm`, `ContentGroupsMenuItems` (menu loader), and `GroupSelect` (in model editor). Each consumer switches from Apollo `useQuery`/`useMutation` to `useFeature()` + MobX cache observation.

### Acceptance criteria

- [ ] `ModelGroupsCache` abstraction + `ModelGroupsCacheFactory` producing `ListCache<CmsModelGroup>`
- [ ] `ListModelGroupsFeature` — gateway with `LIST_CONTENT_MODEL_GROUPS` query, repository rebuilds cache
- [ ] `GetModelGroupFeature` — gateway with `GET_CONTENT_MODEL_GROUP` query
- [ ] `CreateModelGroupFeature` — gateway with `CREATE_CONTENT_MODEL_GROUP` mutation, repository adds to cache
- [ ] `UpdateModelGroupFeature` — gateway with `UPDATE_CONTENT_MODEL_GROUP` mutation, repository updates cache
- [ ] `DeleteModelGroupFeature` — gateway with `DELETE_CONTENT_MODEL_GROUP` mutation, repository removes from cache
- [ ] `ModelGroupFeature` composite registers cache + all sub-features
- [ ] Presentation hooks in `src/presentation/modelGroup/hooks/`: `useListModelGroups`, `useGetModelGroup`, `useCreateModelGroup`, `useUpdateModelGroup`, `useDeleteModelGroup`
- [ ] Unit test per sub-feature: mock gateway, verify use case execution + cache state
- [ ] `ContentModelGroupsDataList` migrated to presentation hooks
- [ ] `ContentModelGroupsForm` migrated to presentation hooks
- [ ] `ContentGroupsMenuItems` migrated to presentation hooks (menu loads from cache)
- [ ] Group GQL definitions removed from `views/contentModelGroups/graphql.ts` (moved to gateways)
- [ ] Build passes, lint passes

---

## Phase 3: Models Feature + Consumer Migration (CRUD Core)

**User stories**: List, view, create, clone, and update content models. Models appear in the main CMS view and are edited in the model editor.

### What to build

The core models domain: shared `ModelsCache` (MobX `ListCache<CmsModel>`), 5 sub-features (list, get, create, clone, update) each with their own gateway, and migration of the primary model consumers. This excludes delete/export/import which are less commonly used and more complex.

Consumer migration includes: `useContentModels`/`useModels` hooks (replaced with `ListModelsFeature`), `ContentModelEditorProvider` (get + update), `ContentModelsDataList`, `NewContentModelDialog` (create), `CloneContentModelDialog` (clone), and menu loaders that read model data.

### Acceptance criteria

- [ ] `ModelsCache` abstraction + `ModelsCacheFactory` producing `ListCache<CmsModel>`
- [ ] `ListModelsFeature` — gateway with `LIST_CONTENT_MODELS` query, repository rebuilds cache
- [ ] `GetModelFeature` — gateway with `GET_CONTENT_MODEL` query, repository updates cache
- [ ] `CreateModelFeature` — gateway with `CREATE_CONTENT_MODEL` mutation, repository adds to cache
- [ ] `CloneModelFeature` — gateway with `CREATE_CONTENT_MODEL_FROM` mutation, repository adds to cache
- [ ] `UpdateModelFeature` — gateway with `UPDATE_CONTENT_MODEL` mutation, repository updates cache
- [ ] Presentation hooks in `src/presentation/model/hooks/`: `useListModels`, `useGetModel`, `useCreateModel`, `useCloneModel`, `useUpdateModel`
- [ ] Unit test per sub-feature: mock gateway, verify use case execution + cache state
- [ ] `useContentModels`/`useModels` replaced with `useListModels` presentation hook
- [ ] `ContentModelEditorProvider` migrated to `useGetModel` + `useUpdateModel`
- [ ] `NewContentModelDialog` migrated to `useCreateModel`
- [ ] `CloneContentModelDialog` migrated to `useCloneModel`
- [ ] `ContentModelsDataList` migrated to presentation hooks
- [ ] Menu loaders (`CmsMenuLoader`) migrated to read from `ModelsCache` + `ModelGroupsCache`
- [ ] Build passes, lint passes

---

## Phase 4: Models Feature (Delete + Import/Export) + Apollo Cleanup

**User stories**: Fully delete models (with cancel), export model structure as JSON, import model structure from JSON.

### What to build

The remaining 4 model sub-features (delete, cancel delete, export, import), migration of their consumers, and removal of all Apollo-based model/group infrastructure.

Consumer migration: `FullyDeleteModelDialog` process, `useCancelDelete`, `useModelExport`, `ImportContext`. After this phase, all model and model group operations use features — the Apollo cache helpers (`cache.ts`) and centralized GQL definitions can be deleted.

### Acceptance criteria

- [ ] `DeleteModelFeature` — gateway with `FULLY_DELETE_CONTENT_MODEL` mutation, repository marks `isBeingDeleted: true` in cache
- [ ] `CancelDeleteModelFeature` — gateway with `CANCEL_DELETE_CONTENT_MODEL` mutation, repository marks `isBeingDeleted: false`
- [ ] `ExportModelsFeature` — gateway with `CMS_EXPORT_STRUCTURE` query, returns JSON (no cache interaction)
- [ ] `ImportModelsFeature` — gateway with `VALIDATE_IMPORT_STRUCTURE` + `IMPORT_STRUCTURE` mutations, repository refreshes cache on success
- [ ] `ModelFeature` composite updated to include all 9 sub-features
- [ ] Presentation hooks in `src/presentation/model/hooks/`: `useDeleteModel`, `useCancelDeleteModel`, `useExportModels`, `useImportModels`
- [ ] Unit test per sub-feature
- [ ] `FullyDeleteModelDialog` process migrated to `useDeleteModel`
- [ ] `useCancelDelete` migrated to `useCancelDeleteModel`
- [ ] `useModelExport` migrated to `useExportModels`
- [ ] `ImportContext` migrated to `useImportModels`
- [ ] `views/contentModels/cache.ts` DELETED
- [ ] Model/group GQL definitions removed from `viewsGraphql.ts` and `graphql/contentModels.ts`
- [ ] Build passes, lint passes

---

## Phase 5: Entry Features (Read + Write Core)

**User stories**: Get, create, update, and delete content entries. This is the basic entry CRUD that powers the entry editor form.

### What to build

Entry domain infrastructure: `EntriesCache` (`ListCache<CmsContentEntry>` per model), `RevisionsCache` (`ListCache<CmsContentEntryRevision>` per entry), and 4 core entry sub-features. Entry gateways are unique — they accept `CmsModel` and use dynamic query generators from `@webiny/app-headless-cms-common`.

Begin migrating `ContentEntryContext` for basic CRUD operations: replace `useCms()` calls for get/create/update/delete with feature use cases. Keep publish/revision/bulk on the old path temporarily.

### Acceptance criteria

- [ ] `EntriesCache` abstraction + `EntriesCacheFactory` producing `ListCache<CmsContentEntry>` keyed by model
- [ ] `RevisionsCache` abstraction + `RevisionsCacheFactory` producing `ListCache<CmsContentEntryRevision>` keyed by entry
- [ ] `GetEntryFeature` — gateway uses `createReadQuery(model)`, repository updates `EntriesCache`
- [ ] `CreateEntryFeature` — gateway uses `createCreateMutation(model)`, repository adds to `EntriesCache`
- [ ] `UpdateEntryFeature` — gateway uses `createUpdateMutation(model)`, repository updates `EntriesCache` + `RevisionsCache`
- [ ] `DeleteEntryFeature` — gateway uses `createDeleteMutation(model)`, repository removes from `EntriesCache`
- [ ] `EntryContext` abstraction holds model reference for gateway query generation
- [ ] Presentation hooks in `src/presentation/entry/hooks/`: `useGetEntry`, `useCreateEntry`, `useUpdateEntry`, `useDeleteEntry`
- [ ] Unit test per sub-feature: mock gateway, verify cache behavior
- [ ] `ContentEntryContext` get/create/update/delete operations migrated to presentation hooks
- [ ] Build passes, lint passes

---

## Phase 6: Entry Features (Publish + Revisions)

**User stories**: Publish and unpublish entries, create new revisions, list all revisions of an entry.

### What to build

4 additional entry sub-features handling the publication lifecycle and revision management. These are tightly coupled — publishing updates both `EntriesCache` (latest published status) and `RevisionsCache` (which revision is published). Creating a revision adds to `RevisionsCache` and updates the latest entry in `EntriesCache`.

Complete the `ContentEntryContext` migration for publish/unpublish/revision operations.

### Acceptance criteria

- [ ] `PublishEntryFeature` — gateway uses `createPublishMutation(model)`, repository updates both caches (marks previous published as unpublished)
- [ ] `UnpublishEntryFeature` — gateway uses `createUnpublishMutation(model)`, repository updates both caches
- [ ] `CreateRevisionFeature` — gateway uses `createCreateFromMutation(model)`, repository adds to `RevisionsCache`, updates `EntriesCache`
- [ ] `ListRevisionsFeature` — gateway uses `createRevisionsQuery(model)`, repository rebuilds `RevisionsCache`
- [ ] Presentation hooks in `src/presentation/entry/hooks/`: `usePublishEntry`, `useUnpublishEntry`, `useCreateRevision`, `useListRevisions`
- [ ] Unit test per sub-feature: mock gateway, verify dual-cache behavior
- [ ] `ContentEntryContext` publish/unpublish/revision operations migrated to presentation hooks
- [ ] Build passes, lint passes

---

## Phase 7: Entry Features (Singleton + Bulk) + Full Apollo Removal

**User stories**: Singleton entry CRUD, bulk actions (publish/unpublish/delete multiple entries), complete removal of Apollo from CMS.

### What to build

Remaining entry sub-features: singleton get/update (simpler variants without revisions), and bulk actions. Migrate `SingletonContentEntryContext` and all bulk action components. Then remove all Apollo infrastructure: `CmsContext`/`CmsProvider`, Apollo wrapper hooks, `apolloClient` property, `getFetchPolicy`, `catchErrorOnExecute`, Apollo dependencies from `package.json`, and `ApolloCacheObjectIdPlugin`.

### Acceptance criteria

- [ ] `GetSingletonEntryFeature` — gateway uses `createReadSingletonQuery(model)`
- [ ] `UpdateSingletonEntryFeature` — gateway uses `createUpdateSingletonMutation(model)`
- [ ] `BulkActionFeature` — gateway uses `createBulkActionMutation(model)`
- [ ] `EntryFeature` composite registers all entry sub-features with `EntryContext`
- [ ] Presentation hooks in `src/presentation/entry/hooks/`: `useGetSingletonEntry`, `useUpdateSingletonEntry`, `useBulkAction`
- [ ] Unit test per sub-feature
- [ ] `SingletonContentEntryContext` fully migrated to presentation hooks
- [ ] Bulk action components (`ActionDelete`, `ActionPublish`, `ActionUnpublish`) migrated to presentation hooks
- [ ] `CmsContext` and `CmsProvider` DELETED
- [ ] Apollo wrapper hooks (`useQuery`, `useMutation`, `useLazyQuery`, `useApolloClient`) DELETED
- [ ] `getFetchPolicy`, `catchErrorOnExecute` utilities DELETED
- [ ] `@apollo/react-hooks` and `apollo-client` removed from `package.json`
- [ ] `ApolloCacheObjectIdPlugin` registration removed
- [ ] All features registered in CMS admin entry point
- [ ] Build passes, lint passes, no Apollo imports remain in `app-headless-cms`
