# Refactor Page Features to DI Container Pattern

## Context

The 13 headless features in `packages/app-website-builder/src/features/pages/` are inconsistently structured. One feature (`translatePage`) already uses the proper DI pattern (`createAbstraction`, `createImplementation`, `createFeature`, `MainGraphQLClient`). The remaining 12 features use a legacy pattern: manual `new` construction in static factory classes, direct Apollo Client usage via `useApolloClient()`, and React hooks exported directly from the features layer.

This refactor migrates all 12 legacy features to the proper DI architecture, replaces Apollo with `MainGraphQLClient`, and moves presentation hooks to the `presentation/` layer.

---

## Reference Implementation

**`translatePage`** is the gold-standard pattern. Every refactored feature must follow this structure:

| File               | Purpose                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| `abstractions.ts`  | All abstractions via `createAbstraction()` + namespace types                                         |
| `XxxUseCase.ts`    | `UseCaseAbstraction.createImplementation({ implementation, dependencies: [Repository] })`            |
| `XxxRepository.ts` | `RepositoryAbstraction.createImplementation({ implementation, dependencies: [Gateway, ...caches] })` |
| `XxxGateway.ts`    | `GatewayAbstraction.createImplementation({ implementation, dependencies: [MainGraphQLClient] })`     |
| `feature.ts`       | `createFeature({ name, register(container), resolve(container) })`                                   |
| `index.ts`         | Exports feature + param types                                                                        |

Presentation hooks go in `presentation/pages/hooks/useXxx.ts` using `useFeature(XxxFeature)`.

Key imports:

- `createAbstraction`, `createFeature` from `@webiny/feature/admin`
- `MainGraphQLClient` from `@webiny/app/features/mainGraphQLClient`
- `useFeature` from `@webiny/app`
- `Container` from `@webiny/di`

---

## Phase 0: Shared Infrastructure

Create shared DI abstractions for caches and repositories that multiple features depend on.

### Files to create

**`features/pages/shared/abstractions.ts`**

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ILoadingRepository } from "@webiny/app-utils";
import type { Page } from "~/domain/Page/Page.js";
import type { ListCache } from "~/shared/cache/ListCache.js";
// ... other type imports as needed

export const PageListCache = createAbstraction<ListCache<Page>>("WebsiteBuilder/PageListCache");
export namespace PageListCache {
  export type Interface = ListCache<Page>;
}

export const FullPageCache = createAbstraction<ListCache<Page>>("WebsiteBuilder/FullPageCache");
export namespace FullPageCache {
  export type Interface = ListCache<Page>;
}

export const WbPageLoadingRepository = createAbstraction<ILoadingRepository>(
  "WebsiteBuilder/PageLoadingRepository"
);
export namespace WbPageLoadingRepository {
  export type Interface = ILoadingRepository;
}
```

Also add abstractions for: `WbPageMetaRepository`, `WbPageParamsRepository`, `WbPageSearchRepository`, `WbPageSortingRepository`, `WbPageFilterRepository`, `WbPageSelectedItemsRepository`, `PageRevisionsCache`, `WbPageRevisionsLoadingRepository` (for getPageRevisions which uses a different loading namespace).

**`features/pages/shared/pageGraphQLFields.ts`**

Extract the logic from `useGetPageGraphQLFields` (which is NOT a hook, just a function) into a pure function. Keep the original `useGetPageGraphQLFields.ts` as a re-export for backward compat with `TrashBin/adapters/usePageFields.ts`.

**`features/pages/shared/feature.ts`**

```ts
export const SharedPageInfrastructureFeature = createFeature({
  name: "WebsiteBuilder/SharedPageInfrastructure",
  register(container) {
    container.registerInstance(PageListCache, pageListCache);
    container.registerInstance(FullPageCache, fullPageCache);
    container.registerInstance(
      WbPageLoadingRepository,
      loadingRepositoryFactory.getRepository("WbPage")
    );
    container.registerInstance(WbPageMetaRepository, metaRepositoryFactory.getRepository("WbPage"));
    // ... register all shared instances from existing factory singletons
  },
  resolve(container) {
    return {};
  }
});
```

**`features/pages/shared/index.ts`** -- barrel export.

**Update `Extension.tsx`** -- add `<RegisterFeature feature={SharedPageInfrastructureFeature} />` before other page features.

### Key files to modify

- `packages/app-website-builder/src/Extension.tsx`
- `packages/app-website-builder/src/features/pages/index.ts`

---

## Phase 1: Simple Mutations -- No Field Selection (deletePage, movePage)

These have the simplest gateways: no dynamic GraphQL field selection.

### Per-feature transformation (deletePage as example)

**Create `features/pages/deletePage/abstractions.ts`** -- consolidates `IDeletePageUseCase.ts`, `IDeletePageRepository.ts`, `IDeletePageGateway.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";

export const DeletePageUseCase = createAbstraction<IDeletePageUseCase>(
  "WebsiteBuilder/DeletePageUseCase"
);
export namespace DeletePageUseCase {
  export type Interface = IDeletePageUseCase;
  export type Params = DeletePageParams;
}

export const DeletePageRepository = createAbstraction<IDeletePageRepository>(
  "WebsiteBuilder/DeletePageRepository"
);
export namespace DeletePageRepository {
  export type Interface = IDeletePageRepository; /* ... */
}

export const DeletePageGateway = createAbstraction<IDeletePageGateway>(
  "WebsiteBuilder/DeletePageGateway"
);
export namespace DeletePageGateway {
  export type Interface = IDeletePageGateway; /* ... */
}
```

**Rewrite `DeletePageUseCase.ts`**:

```ts
class DeletePageUseCaseImpl implements UseCaseAbstraction.Interface { ... }
export const DeletePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeletePageUseCaseImpl,
    dependencies: [DeletePageRepository]
});
```

**Rewrite `DeletePageRepository.ts`** -- inject caches/repos via DI:

```ts
class DeletePageRepositoryImpl implements RepositoryAbstraction.Interface {
  constructor(
    private pageListCache: PageListCache.Interface,
    private metaRepository: WbPageMetaRepository.Interface,
    private gateway: DeletePageGateway.Interface
  ) {}
}
export const DeletePageRepository = RepositoryAbstraction.createImplementation({
  implementation: DeletePageRepositoryImpl,
  dependencies: [PageListCache, WbPageMetaRepository, DeletePageGateway]
});
```

**Rewrite `DeletePageGqlGateway.ts` -> `DeletePageGateway.ts`** -- use `MainGraphQLClient`, string template with `/* GraphQL */`:

```ts
class DeletePageGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}
    async execute(params) {
        const response = await this.client.execute<DeletePageResponse>({ query: DELETE_PAGE, variables: { ... } });
        // handle envelope
    }
}
export const DeletePageGateway = GatewayAbstraction.createImplementation({
    implementation: DeletePageGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

**Rewrite `DeletePageUseCaseWithLoading.ts`** -- use `createDecorator`:

```ts
class DeletePageUseCaseWithLoadingImpl implements UseCaseAbstraction.Interface {
  constructor(
    private loadingRepository: WbPageLoadingRepository.Interface,
    private decoratee: UseCaseAbstraction.Interface
  ) {}
  async execute(params) {
    await this.loadingRepository.runCallBack(this.decoratee.execute(params), loadingActions.delete);
  }
}
export const DeletePageUseCaseWithLoading = UseCaseAbstraction.createDecorator({
  decorator: DeletePageUseCaseWithLoadingImpl,
  dependencies: [WbPageLoadingRepository]
});
```

**Create `feature.ts`**:

```ts
export const DeletePageFeature = createFeature({
  name: "WebsiteBuilder/DeletePage",
  register(container) {
    container.register(DeletePageUseCase);
    container.register(DeletePageRepository).inSingletonScope();
    container.register(DeletePageGateway).inSingletonScope();
    container.registerDecorator(DeletePageUseCaseWithLoading);
  },
  resolve(container) {
    return { useCase: container.resolve(UseCaseAbstraction) };
  }
});
```

**Create `presentation/pages/hooks/useDeletePage.ts`**:

```ts
export const useDeletePage = () => {
  const { useCase } = useFeature(DeletePageFeature);
  const deletePage = useCallback(async params => useCase.execute(params), [useCase]);
  return { deletePage };
};
```

**Delete**: `IDeletePageUseCase.ts`, `IDeletePageRepository.ts`, `IDeletePageGateway.ts`, `DeletePage.ts` (factory), `DeletePageGqlGateway.ts`, old `useDeletePage.ts`.

**Update `Extension.tsx`**: add `<RegisterFeature feature={DeletePageFeature} />`

### movePage follows the same pattern

- Repository deps: `[PageListCache, MovePageGateway]` (no meta)
- Gateway: simple mutation, returns boolean

---

## Phase 2: Mutations With Field Selection (publishPage, unpublishPage, duplicatePage, createPageRevisionFrom)

Same structure as Phase 1, but gateways build field lists using the shared `getPageGraphQLBaseFields()` utility plus feature-specific extra fields hardcoded in the gateway.

### Gateway field-building pattern

```ts
class PublishPageGatewayImpl implements GatewayAbstraction.Interface {
  constructor(private client: MainGraphQLClient.Interface) {}
  async execute(params) {
    const fields = [...getPageGraphQLBaseFields(), "properties", "metadata"];
    const query = /* GraphQL */ `mutation PublishPage($id: ID!) {
            websiteBuilder { publishPage(id: $id) { data { ${fields.join("\n")} } error { code data message } } }
        }`;
    // ...
  }
}
```

### Per-feature details

| Feature                | Repository deps                                | Extra fields                                           |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| publishPage            | `PageListCache, FullPageCache, Gateway`        | `properties, metadata`                                 |
| unpublishPage          | `PageListCache, FullPageCache, Gateway`        | `properties, metadata`                                 |
| duplicatePage          | `PageListCache, WbPageMetaRepository, Gateway` | `properties, metadata`                                 |
| createPageRevisionFrom | `PageListCache, Gateway`                       | `properties, metadata, bindings, elements, extensions` |

---

## Phase 3: createPage, updatePage

### createPage

- Repository deps: `[PageListCache, CreatePageGateway]`
- Gateway fields: `properties, metadata, bindings, elements, extensions`
- UseCase converts params to DTO before passing to repository
- DTOs (`PageDto.ts`, `PageGqlDto.ts`) stay as-is -- they're data shapes, not DI concerns

### updatePage

- Repository deps: `[PageListCache, FullPageCache, UpdatePageGateway]`
- Repository has smart merge logic: listCache gets full replacement, fullPageCache preserves original elements/bindings
- Gateway fields: `properties, metadata, bindings, elements, extensions`

---

## Phase 4: getPage, getPageRevisions

### getPage

- Already has `abstractions.ts` with `GetPageGraphQLFieldSelection` extension point
- Repository deps: `[FullPageCache, GetPageGateway]` (cache-first: returns cached if exists)
- **Extensible field selection**: use `registerFactory` for the gateway to inject resolved field selections:
  ```ts
  register(container) {
      container.register(GetPageUseCase);
      container.register(GetPageRepository).inSingletonScope();
      container.registerFactory(GetPageGatewayAbstraction, () => {
          const client = container.resolve(MainGraphQLClient);
          const fieldSelections = container.resolveAll(GetPageGraphQLFieldSelection);
          const extraFields = ["properties", "metadata", "bindings", "elements", "extensions"];
          return new GetPageGatewayImpl(client, fieldSelections, extraFields);
      });
      container.registerDecorator(GetPageUseCaseWithLoading);
  }
  ```
- Delete `useGetPageGatewayInstance.ts`, `GetPage.ts` (factory)
- Keep `GetPageGraphQLFieldSelection` abstraction in `abstractions.ts` (merge with new UseCase/Repository/Gateway abstractions)

### getPageRevisions

- Uses `PageRevisionsCache` (different cache, different domain model `PageRevision`)
- Uses loading namespace `"WbPageRevisions"` (separate `WbPageRevisionsLoadingRepository` abstraction registered in shared feature)
- Fixed GraphQL fields (no dynamic selection)
- Repository deps: `[PageRevisionsCache, GetPageRevisionsGateway]`

---

## Phase 5: selectPages

- **No Gateway** -- pure state management
- UseCase + Repository only
- Repository wraps `WbPageSelectedItemsRepository` from shared infrastructure
- Generic `<T>` handled at presentation hook level (DI uses `any`)

---

## Phase 6: loadPages (most complex)

### Architecture

Single `LoadPagesFeature` with 5 use cases sharing 1 singleton repository.

**Abstractions**: `LoadPagesUseCase`, `FilterPagesUseCase`, `SearchPagesUseCase`, `SortPagesUseCase`, `LoadMorePagesUseCase`, `ListPagesRepository`, `ListPagesGateway`. Keep existing `ListPagesGraphQLFieldSelection`.

**Repository** (singleton, critical): deps = `[PageListCache, WbPageLoadingRepository, WbPageMetaRepository, WbPageParamsRepository, WbPageSearchRepository, WbPageSortingRepository, WbPageFilterRepository, ListPagesGateway]`

**Search state decoration**: Register `WbPageSearchRepository` in shared feature using `registerFactory`:

```ts
container.registerFactory(WbPageSearchRepository, () => {
  const baseSearch = searchRepositoryFactory.getRepository("WbPage");
  const qsGateway = new QueryStringSearchStateGateway();
  return new SearchRepositoryWithQueryStringGateway(qsGateway, baseSearch);
});
```

**Gateway**: uses `registerFactory` with `resolveAll(ListPagesGraphQLFieldSelection)` for extensible fields.

**Feature resolve**:

```ts
resolve(container) {
    return {
        loadPages: container.resolve(LoadPagesUseCaseAbstraction),
        filterPages: container.resolve(FilterPagesUseCaseAbstraction),
        searchPages: container.resolve(SearchPagesUseCaseAbstraction),
        sortPages: container.resolve(SortPagesUseCaseAbstraction),
        loadMorePages: container.resolve(LoadMorePagesUseCaseAbstraction),
    };
}
```

**5 presentation hooks**: `useLoadPages`, `useFilterPages`, `useSearchPages`, `useSortPages`, `useLoadMorePages` -- all use `useFeature(LoadPagesFeature)`.

**Delete**: `LoadPages.ts`, `FilterPages.ts`, `SearchPages.ts`, `SortPages.ts`, `LoadMorePages.ts` (factory classes), `ListPagesRepositoryFactory.ts`, `useListPagesGateway.ts`, `ListPagesGqlGateway.ts`, all old `useXxx.ts` hooks, all `IXxx.ts` interface files.

---

## Phase 7: Consumer Migration + Cleanup

### Update `features/pages/index.ts`

Re-export hooks from presentation layer for backward compatibility:

```ts
export { useCreatePage } from "~/presentation/pages/hooks/useCreatePage.js";
export { useDeletePage } from "~/presentation/pages/hooks/useDeletePage.js";
// ... etc
```

### Update consumers

Update imports in all consumer files (list below) to use presentation hooks. The hook signatures stay the same, only import paths change.

**Consumer files to update**:

- `modules/pages/PageEditor.tsx` -- useCreatePageRevisionFrom, useGetPage
- `modules/pages/PageEditor/TopBar/PublishButton.tsx` -- usePublishPage
- `modules/pages/PageEditor/TopBar/RevisionsMenu.tsx` -- useGetPageRevisions
- `modules/pages/PageEditor/PageAutoSave.tsx` -- useUpdatePage
- `modules/pages/PagesList/useDocumentList.ts` -- useFilterPages, useLoadPages, useSelectPages
- `modules/pages/PagesList/hooks/useDeletePageConfirmationDialog.tsx`
- `modules/pages/PagesList/hooks/useDuplicatePageConfirmationDialog.tsx`
- `modules/pages/PagesList/hooks/usePublishPageConfirmationDialog.tsx`
- `modules/pages/PagesList/hooks/useUnpublishPageConfirmationDialog.tsx`
- `modules/pages/PagesList/hooks/useMovePageToFolderDialog.tsx`
- `presentation/pages/CreatePage/CreatePageDialog.tsx`
- `modules/pages/configs/list/Browser/BulkAction.tsx`

### Final cleanup

- Remove old factory classes (`XxxPage.ts` pattern)
- Remove individual interface files (`IXxxUseCase.ts` etc.) replaced by `abstractions.ts`
- Remove Apollo-specific gateway files
- Remove `useGetPageGraphQLFields.ts` if no longer needed (check `TrashBin/adapters/usePageFields.ts` -- may need to keep or migrate)

---

## Extension.tsx Final State

```tsx
<RegisterFeature feature={SharedPageInfrastructureFeature} />
<RegisterFeature feature={CreatePageFeature} />  {/* already exists for presentation */}
<RegisterFeature feature={DeletePageFeature} />
<RegisterFeature feature={PublishPageFeature} />
<RegisterFeature feature={UnpublishPageFeature} />
<RegisterFeature feature={GetPageFeature} />
<RegisterFeature feature={LoadPagesFeature} />
<RegisterFeature feature={UpdatePageFeature} />
<RegisterFeature feature={GetPageRevisionsFeature} />
<RegisterFeature feature={DuplicatePageFeature} />
<RegisterFeature feature={MovePageFeature} />
<RegisterFeature feature={SelectPagesFeature} />
<RegisterFeature feature={CreatePageRevisionFromFeature} />
<RegisterFeature feature={TranslatePageFeature} />  {/* already done */}
```

---

## Risk Mitigations

1. **loadPages singleton**: `ListPagesRepository` MUST be `.inSingletonScope()`. All 5 use cases share one repository instance for coordinated state.
2. **Module-level singletons during migration**: `registerInstance` bridges the existing singleton caches into DI. Both DI and legacy code reference the same object -- safe during partial migration.
3. **`useGetPageGraphQLFields` consumers**: `TrashBin/adapters/usePageFields.ts` still imports it. Keep the function available in `shared/pageGraphQLFields.ts` until that consumer is migrated.
4. **Loading decorator ordering**: `container.registerDecorator()` automatically wraps the resolved abstraction. Register after `container.register(UseCase)`.

---

## Verification

After each phase:

1. `yarn build -p @webiny/app-website-builder 2>&1 | tail -30` -- must compile
2. Manual test: navigate to Website Builder > Pages, verify list loads, create/edit/publish/delete pages work
3. After Phase 6: verify filtering, searching, sorting, and pagination work in the page list
4. After Phase 7: verify no remaining imports from old paths
