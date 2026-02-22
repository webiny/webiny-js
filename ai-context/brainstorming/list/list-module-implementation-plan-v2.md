# Generic List Module Factory — Implementation Plan

## Context

Building a new list feature (pages, redirects, users, etc.) requires ~500 lines of boilerplate: repositories, features, presenters, DI wiring. This factory reduces it to ~50 lines of domain-specific code (Gateway + Mapper + types + feature definition). Fresh implementation in `packages/app-admin/src/`, no references to `app-utils/features/List/`.

---

## Architecture Decisions

| Decision | Answer |
|----------|--------|
| DI system | Webiny DI (`createAbstraction`/`createImplementation`/`createFeature`) |
| Consumption | `useFeature(PagesListFeature)` — standard pattern |
| Gateway/Mapper | Standard DI pattern per module (own abstractions + implementations) |
| ListDataRepository | Factory provides default; modules can override |
| Location | Headless in `features/list/`, presenter in `presentation/list/` |
| Selection + Bulk | Included in v1 |
| Orchestration | Presenter orchestrates (init/reload/loadMore/reactions) |
| Error tracking | Presenter-level (LoadingRepository stores errors per action key) |
| Initial params | Repo has `init(params)` method, called by presenter during its `init()` |
| Search debounce | Built-in debounce inside SearchFeature (configurable delay) |
| Sub-features | Full DI — module-scoped abstractions per factory call, decoratable via `container.registerDecorator` |
| Bulk handlers | Call-time from view: `actions.bulk.execute('delete', (ids) => ...)` |
| Consumer API | Factory accepts `Implementation` only — extracts `Abstraction` via `Metadata.getAbstraction()` from `@webiny/di` |
| Factory return | Returns `{ feature, abstractions }` — feature for `useFeature()`, abstractions for DI composition and decoration |
| Extra params (folderId) | Flow through `filters` in `BaseListParams`. Gateway handles transformation (e.g., `folderId` → `folderId_in`). List module is folder-unaware. |
| Presenter composition | Composite presenter depends on `Module.abstractions.presenter` via DI. Factory exposes all module-scoped abstractions. |

---

## File Structure

```
packages/app-admin/src/
├── features/list/
│   ├── abstractions.ts                  # Shared interfaces (exported, no createAbstraction calls)
│   ├── types.ts                         # BaseListParams, ListResponse, ListViewModel, etc.
│   ├── createListModule.ts              # THE FACTORY
│   ├── ListQueryParamsRepository.ts     # Observable params store
│   ├── ListDataRepository.ts            # Gateway+Mapper->items (default impl)
│   ├── LoadingRepository.ts             # Loading states + error tracking
│   ├── SelectionRepository.ts           # Selected IDs set
│   ├── SearchFeature.ts                 # Updates search param (with debounce)
│   ├── FilterFeature.ts                 # Updates filter params
│   ├── SortFeature.ts                   # Updates sort param
│   ├── LoadMoreFeature.ts               # Cursor-based pagination
│   ├── SelectionFeature.ts              # Delegates to SelectionRepository
│   └── BulkActionsFeature.ts            # Executes actions on selected IDs
│
└── presentation/list/
    ├── abstractions.ts                  # GenericListPresenter abstraction
    └── GenericListPresenter.ts          # Orchestrator: lifecycle + VM computation
```

---

## Phase 1: Types + Abstractions

### `features/list/types.ts`

```typescript
export interface BaseListParams {
    search?: string;
    sort?: { by: string; dir: "asc" | "desc" } | null;
    cursor?: string | null;
    limit?: number;
    filters?: Record<string, unknown>;
}

export interface ListResponse<TDto> {
    items: TDto[];
    cursor: string | null;
    hasMore: boolean;
    total?: number;
}

export interface ListError {
    code: string;
    message: string;
    retryable: boolean;
}

export interface SelectionState {
    ids: ReadonlySet<string>;
    count: number;
    isAllSelected: boolean;
    isPartiallySelected: boolean;
    has(id: string): boolean;
}

export interface ListViewModel<TEntity> {
    items: TEntity[];
    total: number | null;
    search: string;
    filters: Record<string, unknown>;
    sort: { by: string; dir: "asc" | "desc" } | null;
    isInitialLoading: boolean;
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    selection: SelectionState;
    isEmpty: boolean;
    isEmptyWithFilters: boolean;
    hasActiveFilters: boolean;
    error: ListError | null;
}
```

### `features/list/abstractions.ts`

All interfaces are exported from this file. The `createAbstraction` calls happen inside the factory (not at module level), so each factory call gets unique DI tokens prefixed by `config.name`.

**Consumer-provided (module-scoped):**
- `IListGateway<TDto, TParams>` — `fetchList(params): Promise<ListResponse<TDto>>`
- `IListMapper<TDto, TEntity>` — `toDomain(dto): TEntity`

**Repositories (module-scoped, created by factory):**
- `IListDataRepository<TEntity, TParams>` — `load(params)`, `append(params)`, `getAll()`, `hasMore()`, `getCursor()`, `getTotal()`, `clear()`
- `IListQueryParamsRepository<TParams>` — `get()`, `init(params)`, `set(updater)`, `reset()`, `subscribe(listener)`, `dispose()`
- `ILoadingRepository` — `isLoading(action)`, `isAnyLoading()`, `runCallback(promise, action)`, `getError(action)`, `clearError(action)`
- `ISelectionRepository` — `getSelected()`, `getCount()`, `has(id)`, `toggle(id)`, `select(id)`, `deselect(id)`, `selectMultiple(ids)`, `clear()`

**Sub-features (module-scoped, created by factory):**
- `ISearchFeature` — `setSearch(query): void`, `clearSearch(): void`
- `IFilterFeature` — `setFilter(key, value): void`, `clearAllFilters(): void`
- `ISortFeature` — `setSort(by, dir): void`, `clearSort(): void`
- `ILoadMoreFeature` — `execute(): Promise<void>`
- `ISelectionFeature` — `toggle(id)`, `select(id)`, `deselect(id)`, `selectAll(items)`, `deselectAll()`
- `IBulkActionsFeature` — `execute(action, handler): Promise<void>`

### `presentation/list/abstractions.ts`

```typescript
export interface IGenericListPresenter<TEntity> {
    vm: ListViewModel<TEntity>;
    init(initialParams?: Partial<BaseListParams>): void;
    reload(): Promise<void>;
    loadMore(): Promise<void>;
    refresh(): Promise<void>;
    reset(): void;
    dispose(): void;
    // Action delegates for the view.
    search: { set(query: string): void; clear(): void };
    filter: { set(key: string, value: unknown): void; clearAll(): void };
    sort: { set(by: string, dir: "asc" | "desc"): void; clear(): void };
    selection: { toggle(id: string): void; selectAll(): void; deselectAll(): void; selectMultiple(ids: string[]): void };
    bulk: { execute(action: string, handler: (ids: string[]) => Promise<void>): Promise<void> };
}
```

---

## Phase 2: Core Repositories

### `ListQueryParamsRepository.ts`
- `makeAutoObservable(this)`, no DI dependencies
- `init(params: TParams)` — sets initial + current state
- `set(updater: (params: TParams) => void)` — mutates via callback, notifies subscribers
- `reset()` — restores to initial params
- `subscribe/dispose` — listener management

### `LoadingRepository.ts`
- `makeAutoObservable(this)`, no DI dependencies
- `Map<string, boolean>` for loading states
- `Map<string, ListError | null>` for errors
- `runCallback(promise, action)` — sets loading true, catches error, stores it, sets loading false

### `ListDataRepository.ts`
- Dependencies: `[GatewayAbstraction, MapperAbstraction]` (module-scoped, extracted from consumer's Implementation via `Metadata`)
- `load(params)` — calls gateway, maps DTOs, replaces items
- `append(params)` — calls gateway, maps DTOs, appends items
- `makeAutoObservable(this)`, `runInAction` for async mutations

### `SelectionRepository.ts`
- `makeAutoObservable(this)`, no DI dependencies
- `Set<string>` for selected IDs
- `toggle`, `select`, `deselect`, `selectMultiple`, `clear`, `getSelected`, `getCount`, `has`

---

## Phase 3: Sub-Features

Each sub-feature has its own interface in `abstractions.ts` and its own impl class file. The factory creates module-scoped abstractions and `createImplementation` wrappers per factory call, making every sub-feature decoratable via `container.registerDecorator(...)`.

| Feature | DI Dependencies | Key Methods |
|---------|-----------------|-------------|
| `SearchFeature` | `[QueryParamsRepo]` | `setSearch(query)` with configurable debounce timer, `clearSearch()` |
| `FilterFeature` | `[QueryParamsRepo]` | `setFilter(key, value)`, `clearAllFilters()` |
| `SortFeature` | `[QueryParamsRepo]` | `setSort(by, dir)`, `clearSort()` |
| `LoadMoreFeature` | `[DataRepo, QueryParamsRepo, LoadingRepo]` | `execute()` — reads cursor, appends |
| `SelectionFeature` | `[SelectionRepo]` | Delegates all ops to SelectionRepository |
| `BulkActionsFeature` | `[SelectionRepo, LoadingRepo]` | `execute(action, handler)` — gets IDs, wraps in loading |

All dependencies reference the module-scoped abstractions (e.g., `name + ":QueryParams"`), not shared globals.

---

## Phase 4: Presenter

### `GenericListPresenter.ts`

Dependencies (injected via DI):
```
[DataRepo, QueryParamsRepo, LoadingRepo,
 [SelectionRepo, { optional: true }],
 [SearchFeature, { optional: true }],
 [FilterFeature, { optional: true }],
 [SortFeature, { optional: true }],
 [LoadMoreFeature, { optional: true }],
 [SelectionFeature, { optional: true }],
 [BulkActionsFeature, { optional: true }]]
```

All sub-features are optional because the factory conditionally registers them based on `config.features`.

**Constructor:**
- `makeAutoObservable(this)`
- Receives all dependencies via DI injection (no internal instantiation)

**`init(initialParams?)`:**
- Calls `queryParams.init(initialParams)` to set initial state
- Triggers initial load via `loading.runCallback(dataRepo.load(queryParams.get()), "initial")`
- Sets up `queryParams.subscribe(...)` to auto-reload on param changes
- Guards against double-init

**`get vm()`** — computed getter assembling `ListViewModel` from all repositories

**`dispose()`** — unsubscribes from queryParams, clears debounce timers

**Action delegates** — `search`, `filter`, `sort`, `selection`, `bulk` properties that forward to sub-features

---

## Phase 5: Factory (`createListModule`)

### Simplified Consumer API

The factory uses `Metadata` from `@webiny/di` to extract the abstraction from an `Implementation` object:

```typescript
import { Metadata } from "@webiny/di";
const gatewayAbstraction = new Metadata(config.gateway).getAbstraction();
```

This means consumers pass only the `Implementation` — no need to pass the `Abstraction` separately.

### Signature

```typescript
export interface ListModuleResult<TEntity, TDto, TParams extends BaseListParams> {
    feature: FeatureDefinition<{ presenter: IGenericListPresenter<TEntity> }>;
    abstractions: {
        presenter: Abstraction<IGenericListPresenter<TEntity>>;
        dataRepository: Abstraction<IListDataRepository<TEntity, TParams>>;
        queryParams: Abstraction<IListQueryParamsRepository<TParams>>;
        loading: Abstraction<ILoadingRepository>;
        selection: Abstraction<ISelectionRepository>;
        search: Abstraction<ISearchFeature>;
        filter: Abstraction<IFilterFeature>;
        sort: Abstraction<ISortFeature>;
        loadMore: Abstraction<ILoadMoreFeature>;
        selectionFeature: Abstraction<ISelectionFeature>;
        bulkActions: Abstraction<IBulkActionsFeature>;
    };
}

export function createListModule<TEntity, TDto, TParams extends BaseListParams>(config: {
    name: string;
    gateway: Implementation;                        // factory extracts abstraction via Metadata
    mapper: Implementation;                         // factory extracts abstraction via Metadata
    dataRepository?: Implementation;                // override default
    presenter?: Implementation;                     // override default
    features?: {
        search?: boolean | { debounceMs?: number };  // default true
        filter?: boolean;                            // default true
        sort?: boolean;                              // default true
        loadMore?: boolean;                          // default true
        selection?: boolean;                         // default false
        bulkActions?: boolean;                       // default false
    };
}): ListModuleResult<TEntity, TDto, TParams>
```

### What It Does

1. Extracts gateway/mapper abstractions from the provided implementations via `Metadata`.

2. Creates module-scoped abstractions with name prefix:
   - **Repositories:** `name + ":DataRepo"`, `name + ":QueryParams"`, `name + ":Loading"`, `name + ":Selection"`
   - **Sub-features:** `name + ":Search"`, `name + ":Filter"`, `name + ":Sort"`, `name + ":LoadMore"`, `name + ":SelectionFeature"`, `name + ":BulkActions"`
   - **Presenter:** `name + ":Presenter"`

3. Creates `createImplementation` wrappers for each against its module-scoped abstraction:
   - `DataRepoImpl` depends on `[gatewayAbstraction, mapperAbstraction]` (extracted in step 1)
   - `QueryParamsImpl`, `LoadingImpl`, `SelectionImpl` — no deps
   - `SearchImpl` depends on `[QueryParamsRepo]`
   - `FilterImpl` depends on `[QueryParamsRepo]`
   - `SortImpl` depends on `[QueryParamsRepo]`
   - `LoadMoreImpl` depends on `[DataRepo, QueryParamsRepo, LoadingRepo]`
   - `SelectionFeatureImpl` depends on `[SelectionRepo]`
   - `BulkActionsImpl` depends on `[SelectionRepo, LoadingRepo]`
   - `PresenterImpl` depends on `[DataRepo, QueryParams, Loading, [Selection, { optional }], [Search, { optional }], [Filter, { optional }], [Sort, { optional }], [LoadMore, { optional }], [SelectionFeature, { optional }], [BulkActions, { optional }]]`

4. Returns `createFeature({ name, register(container), resolve(container) })`:
   - `register`: registers consumer gateway/mapper + all internal implementations with correct scoping. Sub-features conditionally registered based on `config.features`.
   - `resolve`: returns `{ presenter: container.resolve(PresenterAbstraction) }`

---

## Phase 6: Consumer Example (Pages List)

```
app-website-builder/src/features/pages/list/
├── types.ts               # Page, PageDto, PageListParams
├── abstractions.ts        # PagesListGateway, PagesListMapper (createAbstraction)
├── PagesListGateway.ts    # GraphQL implementation
├── PagesListMapper.ts     # DTO -> domain transform
└── feature.ts             # createListModule({ name: "PagesList", ... })
```

**feature.ts:**
```typescript
export const PagesListModule = createListModule<Page, PageDto, PageListParams>({
    name: "PagesList",
    gateway: PagesListGatewayImpl,
    mapper: PagesListMapperImpl,
    features: { selection: true, bulkActions: true }
});

// Export for direct use
export const PagesListFeature = PagesListModule.feature;
```

**Simple view consumption (standalone list):**
```typescript
const { presenter } = useFeature(PagesListFeature);
useEffect(() => { presenter.init({ limit: 20 }); return () => presenter.dispose(); }, []);
const { items, isLoading, selection } = presenter.vm;
presenter.search.set("hello");
presenter.filter.set("folderId", currentFolderId);  // extra params via filters
presenter.bulk.execute("delete", (ids) => deletePages(ids));
```

**Composite presenter (list + folders + breadcrumbs):**
```typescript
// PagesPresenter depends on the list module's presenter abstraction
class PagesPresenterImpl implements PagesPresenter.Interface {
    constructor(
        private listPresenter: IGenericListPresenter<Page>,
        private folderService: IFolderService
    ) { makeAutoObservable(this); }

    get vm() {
        return {
            list: this.listPresenter.vm,
            folders: this.folderService.getFolders(),
        };
    }
}

export const PagesPresenter = PagesPresenterAbstraction.createImplementation({
    implementation: PagesPresenterImpl,
    dependencies: [PagesListModule.abstractions.presenter, FolderService]
});
```

**Gateway decorator (folder-aware search):**
```typescript
class FolderAwareGateway implements IListGateway<PageDto, PageListParams> {
    constructor(
        private descendantFolders: GetDescendantFoldersUseCase.Interface,
        private decoratee: IListGateway<PageDto, PageListParams>
    ) {}

    async fetchList(params: PageListParams) {
        const folderId = params.filters?.folderId;
        if (folderId && params.search) {
            // Expand to descendants for search
            const descendants = await this.descendantFolders.execute(folderId);
            params = { ...params, filters: { ...params.filters, folderId_in: descendants } };
        }
        return this.decoratee.fetchList(params);
    }
}

// Register as decorator on the gateway
export const FolderAwareGatewayDecorator = PagesListGateway.createDecorator({
    decorator: FolderAwareGateway,
    dependencies: [GetDescendantFoldersUseCase]
});
```

---

## Phase 7: Exports + Tests

- Export from `packages/app-admin/src/index.ts`:
  - `createListModule`
  - All interfaces from `features/list/types.ts`
  - `IListGateway`, `IListMapper` from `features/list/abstractions.ts`
  - `IGenericListPresenter` from `presentation/list/abstractions.ts`
- Unit tests for each repository and feature
- Integration test: mock gateway/mapper, create module, resolve presenter, verify full lifecycle

---

## Verification

1. **Build**: `yarn build -p @webiny/app-admin`
2. **Unit tests**: `yarn test packages/app-admin` — all repository/feature/presenter tests pass
3. **Integration test**: Create a mock list module, mount a React component with `useFeature`, verify:
   - Initial load fires
   - Search/filter/sort trigger reload
   - LoadMore appends items
   - Selection state updates correctly
   - Errors surface in VM
   - Dispose cleans up subscriptions
