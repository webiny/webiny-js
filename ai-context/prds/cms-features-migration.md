# Plan: Migrate CMS to Headless Features (Models + Entries)

## Context

The CMS admin currently uses `CmsContext` (React context wrapping Apollo Client) for entry CRUD and direct Apollo hooks (`useQuery`/`useMutation`/`useApolloClient`) for model and model group CRUD. All Apollo cache management is manual (read/write query cache, direct cache deletion hacks).

The goal is to replace all of this with the Webiny headless features pattern: `createFeature` + `createAbstraction` with **UseCase -> Repository -> Gateway** layering, using the `GraphQLClient` from `@webiny/app/features/graphqlClient` instead of Apollo, and MobX-based shared cache (following the ACO `ListCache<T>` pattern from `packages/app-aco/src/features/folders/cache/`).

**Scope:** Models (priority), model groups, and entries. Full Apollo removal from `app-headless-cms`.

## Key Decisions

1. **CMS-scoped GraphQLClient**: `CmsGraphQLClient` abstraction reusing `IGraphQLClient` interface, targeting `${apiUrl}/cms/manage`
2. **Shared ListCache per domain**: `ModelsCache`, `ModelGroupsCache`, `EntriesCache`, `RevisionsCache` — all `ListCache<T>` (MobX), injected via DI
3. **Features location**: `packages/app-headless-cms/src/features/`
4. **Models first**: Models are the more important starting point — entries depend on model data
5. **ACO list cache replaced**: `useRecords()` cache sync replaced by shared `EntriesCache`
6. **Each feature owns its own gateway**: No shared mega-gateways — each sub-feature (e.g., `createModel`) has its own gateway containing only the GQL query/mutation it needs

## Architecture Overview

```
GraphQLClientFeature (shared, targets cms/manage)

ModelFeature (composite)
├── ModelsCache (shared ListCache<CmsModel>, singleton)
├── ListModelsFeature
│   └── ListModelsUseCase → ListModelsRepository → ListModelsGateway
├── GetModelFeature
│   └── GetModelUseCase → GetModelRepository → GetModelGateway
├── CreateModelFeature
│   └── CreateModelUseCase → CreateModelRepository → CreateModelGateway
├── CloneModelFeature
│   └── CloneModelUseCase → CloneModelRepository → CloneModelGateway
├── UpdateModelFeature
│   └── UpdateModelUseCase → UpdateModelRepository → UpdateModelGateway
├── DeleteModelFeature
│   └── DeleteModelUseCase → DeleteModelRepository → DeleteModelGateway
├── CancelDeleteModelFeature
│   └── CancelDeleteModelUseCase → CancelDeleteModelRepository → CancelDeleteModelGateway
├── ExportModelsFeature
│   └── ExportModelsUseCase → ExportModelsRepository → ExportModelsGateway
└── ImportModelsFeature
    └── ImportModelsUseCase → ImportModelsRepository → ImportModelsGateway

ModelGroupFeature (composite)
├── ModelGroupsCache (shared ListCache<CmsModelGroup>, singleton)
├── ListModelGroupsFeature
│   └── ListModelGroupsUseCase → ListModelGroupsRepository → ListModelGroupsGateway
├── GetModelGroupFeature
│   └── GetModelGroupUseCase → GetModelGroupRepository → GetModelGroupGateway
├── CreateModelGroupFeature
│   └── CreateModelGroupUseCase → CreateModelGroupRepository → CreateModelGroupGateway
├── UpdateModelGroupFeature
│   └── UpdateModelGroupUseCase → UpdateModelGroupRepository → UpdateModelGroupGateway
└── DeleteModelGroupFeature
    └── DeleteModelGroupUseCase → DeleteModelGroupRepository → DeleteModelGroupGateway

EntryFeature (composite)
├── EntriesCache (shared ListCache<CmsContentEntry>, singleton)
├── RevisionsCache (shared ListCache<CmsContentEntryRevision>, singleton)
├── GetEntryFeature
├── CreateEntryFeature
├── UpdateEntryFeature
├── DeleteEntryFeature
├── PublishEntryFeature
├── UnpublishEntryFeature
├── CreateRevisionFeature
├── ListRevisionsFeature
├── BulkActionFeature
├── GetSingletonEntryFeature
└── UpdateSingletonEntryFeature
```

## File Structure

```
packages/app-headless-cms/src/features/
├── graphQLClient/
│   ├── abstractions.ts
│   ├── CmsGraphQLClient.ts
│   └── feature.ts
├── model/
│   ├── cache/
│   │   ├── ModelsCacheFactory.ts
│   │   └── index.ts
│   ├── abstractions.ts             # ModelsCache
│   ├── listModels/
│   │   ├── abstractions.ts         # UseCase, Repository, Gateway abstractions
│   │   ├── ListModelsUseCase.ts
│   │   ├── ListModelsRepository.ts
│   │   ├── ListModelsGateway.ts    # Contains LIST_CONTENT_MODELS query
│   │   └── feature.ts
│   ├── getModel/
│   │   ├── abstractions.ts
│   │   ├── GetModelUseCase.ts
│   │   ├── GetModelRepository.ts
│   │   ├── GetModelGateway.ts      # Contains GET_CONTENT_MODEL query
│   │   └── feature.ts
│   ├── createModel/
│   │   ├── abstractions.ts
│   │   ├── CreateModelUseCase.ts
│   │   ├── CreateModelRepository.ts
│   │   ├── CreateModelGateway.ts   # Contains CREATE_CONTENT_MODEL mutation
│   │   └── feature.ts
│   ├── cloneModel/
│   │   ├── abstractions.ts
│   │   ├── CloneModelUseCase.ts
│   │   ├── CloneModelRepository.ts
│   │   ├── CloneModelGateway.ts    # Contains CREATE_CONTENT_MODEL_FROM mutation
│   │   └── feature.ts
│   ├── updateModel/
│   │   ├── abstractions.ts
│   │   ├── UpdateModelUseCase.ts
│   │   ├── UpdateModelRepository.ts
│   │   ├── UpdateModelGateway.ts   # Contains UPDATE_CONTENT_MODEL mutation
│   │   └── feature.ts
│   ├── deleteModel/
│   │   ├── abstractions.ts
│   │   ├── DeleteModelUseCase.ts
│   │   ├── DeleteModelRepository.ts
│   │   ├── DeleteModelGateway.ts   # Contains FULLY_DELETE_CONTENT_MODEL mutation
│   │   └── feature.ts
│   ├── cancelDeleteModel/
│   │   ├── abstractions.ts
│   │   ├── CancelDeleteModelUseCase.ts
│   │   ├── CancelDeleteModelRepository.ts
│   │   ├── CancelDeleteModelGateway.ts  # Contains CANCEL_DELETE_CONTENT_MODEL mutation
│   │   └── feature.ts
│   ├── exportModels/
│   │   ├── abstractions.ts
│   │   ├── ExportModelsUseCase.ts
│   │   ├── ExportModelsRepository.ts
│   │   ├── ExportModelsGateway.ts  # Contains CMS_EXPORT_STRUCTURE query
│   │   └── feature.ts
│   ├── importModels/
│   │   ├── abstractions.ts
│   │   ├── ImportModelsUseCase.ts
│   │   ├── ImportModelsRepository.ts
│   │   ├── ImportModelsGateway.ts  # Contains VALIDATE_IMPORT + IMPORT_STRUCTURE mutations
│   │   └── feature.ts
│   └── feature.ts                   # Composite: registers all model sub-features
├── modelGroup/
│   ├── cache/
│   │   ├── ModelGroupsCacheFactory.ts
│   │   └── index.ts
│   ├── abstractions.ts             # ModelGroupsCache
│   ├── listModelGroups/
│   │   ├── abstractions.ts
│   │   ├── ListModelGroupsUseCase.ts
│   │   ├── ListModelGroupsRepository.ts
│   │   ├── ListModelGroupsGateway.ts   # Contains LIST_CONTENT_MODEL_GROUPS query
│   │   └── feature.ts
│   ├── getModelGroup/
│   │   ├── abstractions.ts
│   │   ├── GetModelGroupUseCase.ts
│   │   ├── GetModelGroupRepository.ts
│   │   ├── GetModelGroupGateway.ts     # Contains GET_CONTENT_MODEL_GROUP query
│   │   └── feature.ts
│   ├── createModelGroup/
│   │   ├── abstractions.ts
│   │   ├── CreateModelGroupUseCase.ts
│   │   ├── CreateModelGroupRepository.ts
│   │   ├── CreateModelGroupGateway.ts  # Contains CREATE_CONTENT_MODEL_GROUP mutation
│   │   └── feature.ts
│   ├── updateModelGroup/
│   │   ├── abstractions.ts
│   │   ├── UpdateModelGroupUseCase.ts
│   │   ├── UpdateModelGroupRepository.ts
│   │   ├── UpdateModelGroupGateway.ts  # Contains UPDATE_CONTENT_MODEL_GROUP mutation
│   │   └── feature.ts
│   ├── deleteModelGroup/
│   │   ├── abstractions.ts
│   │   ├── DeleteModelGroupUseCase.ts
│   │   ├── DeleteModelGroupRepository.ts
│   │   ├── DeleteModelGroupGateway.ts  # Contains DELETE_CONTENT_MODEL_GROUP mutation
│   │   └── feature.ts
│   └── feature.ts                   # Composite: registers all model group sub-features
├── entry/
│   ├── cache/
│   │   ├── EntriesCacheFactory.ts
│   │   ├── RevisionsCacheFactory.ts
│   │   └── index.ts
│   ├── abstractions.ts
│   ├── getEntry/
│   │   ├── abstractions.ts
│   │   ├── GetEntryUseCase.ts
│   │   ├── GetEntryRepository.ts
│   │   ├── GetEntryGateway.ts          # Contains createReadQuery(model)
│   │   └── feature.ts
│   ├── createEntry/
│   │   ├── ...                          # Same pattern: UseCase, Repository, Gateway, feature
│   │   └── CreateEntryGateway.ts       # Contains createCreateMutation(model)
│   ├── updateEntry/
│   │   └── UpdateEntryGateway.ts       # Contains createUpdateMutation(model)
│   ├── deleteEntry/
│   │   └── DeleteEntryGateway.ts       # Contains createDeleteMutation(model)
│   ├── publishEntry/
│   │   └── PublishEntryGateway.ts      # Contains createPublishMutation(model)
│   ├── unpublishEntry/
│   │   └── UnpublishEntryGateway.ts    # Contains createUnpublishMutation(model)
│   ├── createRevision/
│   │   └── CreateRevisionGateway.ts    # Contains createCreateFromMutation(model)
│   ├── listRevisions/
│   │   └── ListRevisionsGateway.ts     # Contains createRevisionsQuery(model)
│   ├── bulkAction/
│   │   └── BulkActionGateway.ts        # Contains createBulkActionMutation(model)
│   ├── getSingletonEntry/
│   │   └── GetSingletonEntryGateway.ts # Contains createReadSingletonQuery(model)
│   ├── updateSingletonEntry/
│   │   └── UpdateSingletonEntryGateway.ts # Contains createUpdateSingletonMutation(model)
│   └── feature.ts
```

## Implementation Phases

### Phase 1: GraphQLClient

Create the CMS-scoped GraphQL client targeting `${apiUrl}/cms/manage`.

**`features/graphQLClient/abstractions.ts`**
```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IGraphQLClient } from "@webiny/app/features/graphqlClient";

export const CmsGraphQLClient = createAbstraction<IGraphQLClient>("CmsGraphQLClient");
export namespace CmsGraphQLClient {
    export type Interface = IGraphQLClient;
}
```

**`features/graphQLClient/CmsGraphQLClient.ts`**
- Same as `FetchGraphQLClient` but reads `envConfig.get("apiUrl")` and appends `/cms/manage`
- Uses `createImplementation` with dependency on `EnvConfig`
- Reuses `RequestValue` from `@webiny/app/features/graphqlClient`

**`features/graphQLClient/feature.ts`**
```ts
export const CmsGraphQLClientFeature = createFeature({
    name: "CmsGraphQLClient",
    register(container) {
        container.register(CmsGraphQLClientImpl).inSingletonScope();
    },
    resolve(container) {
        return { client: container.resolve(CmsGraphQLClient) };
    }
});
```

### Phase 2: Model Features — Shared Cache

**ModelsCache** — Follow ACO `ListCache<T>` pattern:
- `ModelsCacheFactory`: `ListCache<CmsModel>` (single global instance)

**`features/model/abstractions.ts`**:
```ts
export const ModelsCache = createAbstraction<IListCache<CmsModel>>("ModelsCache");
export namespace ModelsCache { export type Interface = IListCache<CmsModel>; }
```

### Phase 2b: Model Group Features — Shared Cache

**ModelGroupsCache** — Follow ACO `ListCache<T>` pattern:
- `ModelGroupsCacheFactory`: `ListCache<CmsModelGroup>` (single global instance)

**`features/modelGroup/abstractions.ts`**:
```ts
export const ModelGroupsCache = createAbstraction<IListCache<CmsModelGroup>>("ModelGroupsCache");
export namespace ModelGroupsCache { export type Interface = IListCache<CmsModelGroup>; }
```

**Important:** `FetchGraphQLClient.execute()` returns `json.data` (GQL response data field). So for `listContentModels { data, error }`, the gateway receives `{ listContentModels: { data, error } }`.

### Phase 3: Model Sub-Features

Each follows UseCase → Repository → Gateway, where **each feature has its own gateway** containing only the GQL operation it needs. Every gateway injects `CmsGraphQLClient` and defines its GQL query/mutation as a local constant.

**ListModels**: Gateway contains `LIST_CONTENT_MODELS` query. Repository clears and rebuilds `ModelsCache`.

**GetModel**: Gateway contains `GET_CONTENT_MODEL` query. Repository updates model in `ModelsCache`.

**CreateModel**: Gateway contains `CREATE_CONTENT_MODEL` mutation. Repository adds new model to `ModelsCache`.

**CloneModel**: Gateway contains `CREATE_CONTENT_MODEL_FROM` mutation. Repository adds cloned model to `ModelsCache`.

**UpdateModel**: Gateway contains `UPDATE_CONTENT_MODEL` mutation. Repository updates model in `ModelsCache`.

**DeleteModel**: Gateway contains `FULLY_DELETE_CONTENT_MODEL` mutation. Repository marks `isBeingDeleted: true` in cache.

**CancelDeleteModel**: Gateway contains `CANCEL_DELETE_CONTENT_MODEL` mutation. Repository marks `isBeingDeleted: false` in cache.

**ExportModels**: Gateway contains `CMS_EXPORT_STRUCTURE` query. Repository returns JSON structure, no cache interaction.

**ImportModels**: Gateway contains `VALIDATE_IMPORT_STRUCTURE` + `IMPORT_STRUCTURE` mutations. Repository does two-step validate→import, refreshes `ModelsCache` on success.

### Phase 3b: Model Group Sub-Features

Same per-feature gateway pattern with `ModelGroupsCache`:

**ListModelGroups**: Gateway contains `LIST_CONTENT_MODEL_GROUPS` query. Repository rebuilds `ModelGroupsCache`.
**GetModelGroup**: Gateway contains `GET_CONTENT_MODEL_GROUP` query.
**CreateModelGroup**: Gateway contains `CREATE_CONTENT_MODEL_GROUP` mutation. Repository adds to `ModelGroupsCache`.
**UpdateModelGroup**: Gateway contains `UPDATE_CONTENT_MODEL_GROUP` mutation. Repository updates in `ModelGroupsCache`.
**DeleteModelGroup**: Gateway contains `DELETE_CONTENT_MODEL_GROUP` mutation. Repository removes from `ModelGroupsCache`.

### Phase 4: Composite Features

**`features/model/feature.ts`**:
```ts
export const ModelFeature = createFeature({
    name: "CmsModel",
    register(container) {
        container.registerInstance(ModelsCache, modelsCacheFactory.getCache());

        ListModelsFeature.register(container);
        GetModelFeature.register(container);
        CreateModelFeature.register(container);
        CloneModelFeature.register(container);
        UpdateModelFeature.register(container);
        DeleteModelFeature.register(container);
        CancelDeleteModelFeature.register(container);
        ExportModelsFeature.register(container);
        ImportModelsFeature.register(container);
    }
});
```

**`features/modelGroup/feature.ts`**:
```ts
export const ModelGroupFeature = createFeature({
    name: "CmsModelGroup",
    register(container) {
        container.registerInstance(ModelGroupsCache, modelGroupsCacheFactory.getCache());

        ListModelGroupsFeature.register(container);
        GetModelGroupFeature.register(container);
        CreateModelGroupFeature.register(container);
        UpdateModelGroupFeature.register(container);
        DeleteModelGroupFeature.register(container);
    }
});
```

### Phase 5: Entry Features — Cache + Gateway

**EntriesCache**: `ListCache<CmsContentEntry>` per model (keyed by `modelId`)
**RevisionsCache**: `ListCache<CmsContentEntryRevision>` per entry (keyed by `entryId`)

**`features/entry/abstractions.ts`**:
```ts
export const EntriesCache = createAbstraction<IListCache<CmsContentEntry>>("EntriesCache");
export namespace EntriesCache { export type Interface = IListCache<CmsContentEntry>; }

export const RevisionsCache = createAbstraction<IListCache<CmsContentEntryRevision>>("RevisionsCache");
export namespace RevisionsCache { export type Interface = IListCache<CmsContentEntryRevision>; }

export const EntryContext = createAbstraction<IEntryContext>("EntryContext");
export namespace EntryContext { export type Interface = IEntryContext; }
```

Each entry sub-feature has its own gateway. Entry gateways are unique in that they accept `CmsModel` and use dynamic query generators from `@webiny/app-headless-cms-common` (e.g., `createReadQuery(model)`, `createCreateMutation(model)`). Each gateway:
- Injects `CmsGraphQLClient`
- Calls its specific query generator with the model
- Unwraps Webiny envelope: `response.content.data` / `response.content.error`
- Uses model's `singularApiName`/`pluralApiName` to extract the right field from the dynamic operation name

### Phase 6: Entry Sub-Features

Each follows UseCase → Repository → Gateway. Key repository behaviors:

**GetEntry**: Gateway uses `createReadQuery(model)`. Repository updates `EntriesCache`.
**CreateEntry**: Gateway uses `createCreateMutation(model)`. Repository adds to `EntriesCache`.
**UpdateEntry**: Gateway uses `createUpdateMutation(model)`. Repository updates `EntriesCache` and `RevisionsCache`.
**DeleteEntry**: Gateway uses `createDeleteMutation(model)`. Repository removes from `EntriesCache`; if revision, from `RevisionsCache`.
**PublishEntry**: Gateway uses `createPublishMutation(model)`. Repository updates `EntriesCache` and `RevisionsCache` (marks prev published as unpublished).
**UnpublishEntry**: Gateway uses `createUnpublishMutation(model)`. Repository updates both caches.
**CreateRevision**: Gateway uses `createCreateFromMutation(model)`. Repository adds to `RevisionsCache`, updates `EntriesCache`.
**ListRevisions**: Gateway uses `createRevisionsQuery(model)`. Repository rebuilds `RevisionsCache`.
**BulkAction**: Gateway uses `createBulkActionMutation(model)`. Repository executes bulk operation.
**GetSingletonEntry**: Gateway uses `createReadSingletonQuery(model)`.
**UpdateSingletonEntry**: Gateway uses `createUpdateSingletonMutation(model)`.

### Phase 7: Entry Composite Feature

```ts
export const EntryFeature = createFeature({
    name: "CmsEntry",
    register(container, context: EntryContext.Interface) {
        container.registerInstance(EntryContext, context);
        container.registerInstance(EntriesCache, entriesCacheFactory.getCache(context.modelId));
        container.registerInstance(RevisionsCache, revisionsCacheFactory.getCache(context.modelId));

        // Sub-features (each registers its own gateway)
        GetEntryFeature.register(container);
        CreateEntryFeature.register(container);
        UpdateEntryFeature.register(container);
        DeleteEntryFeature.register(container);
        PublishEntryFeature.register(container);
        UnpublishEntryFeature.register(container);
        CreateRevisionFeature.register(container);
        ListRevisionsFeature.register(container);
        BulkActionFeature.register(container);
        GetSingletonEntryFeature.register(container);
        UpdateSingletonEntryFeature.register(container);
    }
});
```

### Phase 8: Migrate Model Consumers

**8a. Replace `useContentModels` / `useModels` hook** — Currently uses `useQuery(LIST_CONTENT_MODELS)` Apollo wrapper. Replace with a hook that resolves `ListModelsFeature` via `useFeature()` and observes `ModelsCache` via MobX `autorun`.

**8b. Replace `ContentModelEditorProvider`** — Currently uses `GET_CONTENT_MODEL` and `UPDATE_CONTENT_MODEL` via Apollo. Replace with `GetModelFeature` and `UpdateModelFeature`.

**Key file:** `packages/app-headless-cms/src/admin/components/ContentModelEditor/ContentModelEditorProvider.tsx`
- `getContentModel()` (line 207-229) → `useFeature(GetModelFeature).useCase.execute(modelId)`
- `saveContentModel()` (line 137-182) → `useFeature(UpdateModelFeature).useCase.execute(modelId, data)`

**8c. Replace `NewContentModelDialog`** — Uses `CREATE_CONTENT_MODEL` mutation + `addModelToListCache`/`addModelToGroupCache`. Replace with `CreateModelFeature` (repository handles cache).

**8d. Replace `CloneContentModelDialog`** — Uses `CREATE_CONTENT_MODEL_FROM` mutation + cache updates. Replace with `CloneModelFeature`.

**8e. Replace `FullyDeleteModelDialog` + `useCancelDelete`** — Uses `FULLY_DELETE_CONTENT_MODEL` and `CANCEL_DELETE_CONTENT_MODEL` mutations + manual cache updates. Replace with `DeleteModelFeature` and `CancelDeleteModelFeature`.

**8f. Replace model export/import** — `useModelExport` and `ImportContext` currently use `useApolloClient` directly. Replace with `ExportModelsFeature` and `ImportModelsFeature`.

**8g. Replace model groups CRUD** — `ContentModelGroupsDataList` and `ContentModelGroupsForm` use Apollo `useQuery`/`useMutation`. Replace with `ModelGroupFeature` features.

**8h. Replace menu loaders** — `ContentGroupsMenuItems` and `CmsMenuLoader` use `useQuery(LIST_MENU_CONTENT_GROUPS_MODELS)`. Replace with `ModelFeature` + `ModelGroupFeature` reading from caches.

**8i. Remove `cache.ts`** — The entire `views/contentModels/cache.ts` file (Apollo cache manipulation) becomes unnecessary.

### Phase 9: Migrate Entry Consumers

**9a. CmsContext compatibility shim** — Rewrite `CmsProvider` internals to delegate entry methods to features. Keep `apolloClient` temporarily for any remaining consumers.

**9b. Migrate `ContentEntryContext`** — Replace React state with MobX cache observations:
- Remove `useState<CmsContentEntry>` → read from `EntriesCache`
- Remove `useState<CmsContentEntryRevision[]>` → read from `RevisionsCache`
- Remove `useCms()` → use `useFeature()` for each operation
- Remove `useQuery(READ_CONTENT)` → use `GetEntryUseCase`
- Remove ACO `useRecords()` cache sync → `EntriesCache` is the source of truth

**9c. Migrate `SingletonContentEntryContext`** — Same approach, simpler.

**9d. Migrate BulkAction components** — Replace `useCms()` calls with feature use cases.

**9e. Register features** in CMS admin entry point.

### Phase 10: Full Cleanup

- Remove `CmsContext` and `CmsProvider` entirely
- Remove all Apollo wrapper hooks (`useQuery`, `useMutation`, `useLazyQuery`, `useApolloClient`)
- Remove `apolloClient` property and `createApolloClient` prop
- Remove `getFetchPolicy` utility
- Remove `catchErrorOnExecute`
- Remove `@apollo/react-hooks` and `apollo-client` from package.json
- Remove `ApolloCacheObjectIdPlugin` registration
- Remove `views/contentModels/cache.ts` (Apollo cache helpers)
- Remove GQL definitions from `viewsGraphql.ts` and `graphql/contentModels.ts` (moved to gateways)

## Critical Files to Modify

### Model migration
| File | Change |
|------|--------|
| `src/admin/hooks/useContentModels.ts` | Replace with hook using ListModelsFeature |
| `src/admin/components/ContentModelEditor/ContentModelEditorProvider.tsx` | Replace Apollo calls with GetModel/UpdateModel features |
| `src/admin/views/contentModels/ContentModelsDataList.tsx` | Use features instead of Apollo |
| `src/admin/views/contentModels/NewContentModelDialog.tsx` | Use CreateModelFeature |
| `src/admin/views/contentModels/CloneContentModelDialog.tsx` | Use CloneModelFeature |
| `src/admin/views/contentModels/fullDelete/dialog/process.ts` | Use DeleteModelFeature |
| `src/admin/views/contentModels/fullDelete/useCancelDelete.tsx` | Use CancelDeleteModelFeature |
| `src/admin/views/contentModels/exporting/useModelExport.ts` | Use ExportModelsFeature |
| `src/admin/views/contentModels/importing/ImportContext.tsx` | Use ImportModelsFeature |
| `src/admin/views/contentModelGroups/ContentModelGroupsDataList.tsx` | Use group features |
| `src/admin/views/contentModelGroups/ContentModelGroupsForm.tsx` | Use group features |
| `src/admin/menus/ContentGroupsMenuItems.tsx` | Use features for menu data |
| `src/admin/views/contentModels/cache.ts` | DELETE entirely |

### Entry migration
| File | Change |
|------|--------|
| `src/admin/contexts/Cms/index.tsx` | Shim then delete |
| `src/admin/views/contentEntries/ContentEntry/ContentEntryContext.tsx` | Replace with MobX cache + features |
| `src/admin/views/contentEntries/ContentEntry/SingletonContentEntryContext.tsx` | Same |
| `src/admin/config/contentEntries/list/Browser/BulkAction.tsx` | Use BulkActionFeature |
| `src/admin/components/ContentEntries/BulkActions/Action*.tsx` | Use entry features |

## Existing Code to Reuse

| What | Where | How |
|------|-------|-----|
| Entry query/mutation generators | `@webiny/app-headless-cms-common` (`createReadQuery`, etc.) | Each entry gateway calls its generator with model |
| `ListCache<T>` + factory | `packages/app-aco/src/features/folders/cache/` | Import for all caches |
| `IListCache<T>` interface | `packages/app-aco/src/features/folders/cache/ListCache.ts` | Import for abstractions |
| `RequestValue` | `@webiny/app/features/graphqlClient/RequestValue.ts` | `features/graphQLClient/` impl |
| `EnvConfig` | `@webiny/app/features/envConfig` | API URL |
| `loadingRepositoryFactory` | `@webiny/app-utils` | Loading state management |
| Model GQL strings | `src/admin/viewsGraphql.ts`, `src/admin/graphql/contentModels.ts` | Move each to its sub-feature's gateway |
| Group GQL strings | `src/admin/views/contentModelGroups/graphql.ts` | Move each to its sub-feature's gateway |
| Import/export GQL strings | `src/admin/views/contentModels/importing/graphql.ts`, `exporting/graphql.ts` | Move to respective feature gateways |

## Verification

1. **Unit tests**: Mock gateways, test repository cache behavior for each feature
2. **Build**: `yarn build -p @webiny/app-headless-cms 2>&1 | tail -30`
3. **Lint**: `y eslint`
4. **Manual — Models**: Create model, edit fields, clone, export, import, delete (full delete + cancel)
5. **Manual — Groups**: Create group, edit, delete, verify menu updates
6. **Manual — Entries**: Create/edit/publish/unpublish/delete entries, verify list updates
7. **Manual — Singleton**: Load + update singleton model entry
8. **Manual — Bulk**: Select multiple entries, bulk publish/unpublish/delete
