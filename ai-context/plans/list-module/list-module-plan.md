# Generic List Module Implementation Plan

## Document Info
- **Version:** 1.0
- **Created:** January 26, 2026
- **Purpose:** Implementation guide for creating a reusable List Module Factory

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Project Structure](#3-project-structure)
4. [Interface Contracts](#4-interface-contracts)
5. [Core Components Implementation](#5-core-components-implementation)
6. [Factory Implementation](#6-factory-implementation)
7. [React Integration](#7-react-integration)
8. [Implementation Phases](#8-implementation-phases)
9. [Example Module: Pages List](#9-example-module-pages-list)
10. [Testing Strategy](#10-testing-strategy)
11. [Migration Guide](#11-migration-guide)

---

## 1. Executive Summary

### Problem Statement

Currently, building a new list feature (Pages, Redirects, Users, etc.) requires:
- Deep knowledge of MobX, DI containers, and the internal architecture
- Repetitive boilerplate for repositories, features, and presenters
- Risk of inconsistent implementations across different lists
- High onboarding cost for new developers

### Solution

A **List Module Factory** that:
- Abstracts all internal complexity
- Requires developers to only implement Gateway + Mapper
- Provides type-safe, consistent APIs across all list features
- Generates ready-to-use React hooks

### Developer Experience (Before vs After)

**Before:** ~500 lines of boilerplate per list feature
**After:** ~50 lines of domain-specific code

---

## 2. Goals & Non-Goals

### Goals

| Goal | Description |
|------|-------------|
| **Simplicity** | Developers implement only Gateway + Mapper |
| **Type Safety** | Full TypeScript inference from entity types |
| **Consistency** | All lists behave identically |
| **Extensibility** | Custom presenters for special cases |
| **Testability** | Each layer independently testable |
| **Zero Lock-in** | Can eject to manual implementation if needed |

### Non-Goals

| Non-Goal | Reason |
|----------|--------|
| UI Components | Framework provides data, not UI |
| Server-side rendering | Client-side MobX focus |
| Offline support | Out of scope for v1 |
| Real-time updates | Can be added as extension later |

---

## 3. Project Structure

```
src/
├── core/
│   └── list-module/
│       ├── index.ts                      # Public API exports
│       ├── createListModule.ts           # Main factory function
│       │
│       ├── contracts/                    # Interface definitions
│       │   ├── index.ts
│       │   ├── ListGateway.ts
│       │   ├── ListMapper.ts
│       │   ├── ListModuleConfig.ts
│       │   ├── ListViewModel.ts
│       │   └── ListActions.ts
│       │
│       ├── repositories/                 # State management
│       │   ├── index.ts
│       │   ├── ListQueryParamsRepository.ts
│       │   ├── ListDataRepository.ts
│       │   ├── LoadingRepository.ts
│       │   └── SelectionRepository.ts
│       │
│       ├── features/                     # Headless feature services
│       │   ├── index.ts
│       │   ├── SearchFeature.ts
│       │   ├── FilterFeature.ts
│       │   ├── SortFeature.ts
│       │   ├── LoadMoreFeature.ts
│       │   ├── SelectionFeature.ts
│       │   └── BulkActionsFeature.ts
│       │
│       ├── presenter/                    # View model generation
│       │   ├── index.ts
│       │   ├── GenericListPresenter.ts
│       │   └── PresenterFactory.ts
│       │
│       ├── hooks/                        # React integration
│       │   ├── index.ts
│       │   ├── useListModule.ts
│       │   └── ListModuleContext.ts
│       │
│       ├── tokens/                       # DI injection tokens
│       │   └── index.ts
│       │
│       └── __tests__/                    # Unit tests
│           ├── repositories/
│           ├── features/
│           ├── presenter/
│           └── integration/
│
├── modules/                              # Concrete implementations
│   ├── pages/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── PagesGateway.ts
│   │   ├── PageMapper.ts
│   │   └── __tests__/
│   │
│   ├── redirects/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── RedirectsGateway.ts
│   │   ├── RedirectMapper.ts
│   │   └── __tests__/
│   │
│   └── [other-modules]/
│
└── shared/
    ├── types/
    │   └── BaseListParams.ts
    └── utils/
        └── debounce.ts
```

---

## 4. Interface Contracts

### 4.1 Base Types

```typescript
// shared/types/BaseListParams.ts

export interface BaseListParams {
    search?: string;
    sort?: SortParams | null;
    cursor?: string | null;
    limit?: number;
}

export interface SortParams {
    by: string;
    direction: "asc" | "desc";
}

export interface ListResponse<TDto> {
    items: TDto[];
    cursor: string | null;
    total?: number;
    hasMore: boolean;
}
```

### 4.2 Gateway Contract

```typescript
// core/list-module/contracts/ListGateway.ts

export interface ListGateway<TDto, TParams extends BaseListParams> {
    /**
     * Fetches a page of items from the API
     * @param params - Query parameters including search, filters, sort, pagination
     * @returns Promise resolving to items, pagination info
     */
    fetchList(params: TParams): Promise<ListResponse<TDto>>;
}

// Namespace for DI token and type utilities
export namespace ListGateway {
    export interface Interface<TDto, TParams extends BaseListParams> 
        extends ListGateway<TDto, TParams> {}
    
    export const Token = Symbol("ListGateway");
}
```

### 4.3 Mapper Contract

```typescript
// core/list-module/contracts/ListMapper.ts

export interface ListMapper<TDto, TEntity> {
    /**
     * Transforms a DTO from the API into a domain entity
     * @param dto - Raw data transfer object
     * @returns Domain entity
     */
    toDomain(dto: TDto): TEntity;
    
    /**
     * Optional: Transform domain entity back to DTO
     * Used for optimistic updates or local mutations
     */
    toDto?(entity: TEntity): TDto;
}

export namespace ListMapper {
    export interface Interface<TDto, TEntity> 
        extends ListMapper<TDto, TEntity> {}
    
    export const Token = Symbol("ListMapper");
}
```

### 4.4 Module Configuration

```typescript
// core/list-module/contracts/ListModuleConfig.ts

export interface ListModuleConfig<
    TEntity extends { id: string },
    TDto,
    TParams extends BaseListParams
> {
    /** Unique identifier for this module (used for debugging, logging) */
    name: string;
    
    /** Gateway class for API calls */
    gateway: new (...args: any[]) => ListGateway<TDto, TParams>;
    
    /** Mapper class for DTO transformation */
    mapper: new (...args: any[]) => ListMapper<TDto, TEntity>;
    
    /** Optional: Custom presenter class */
    presenter?: new (...args: any[]) => GenericListPresenter<TEntity, TParams>;
    
    /** Module behavior configuration */
    config: {
        /** Initial query parameters */
        initialParams: Partial<TParams>;
        
        /** Available filter definitions (for type safety) */
        filters?: FilterDefinitions<TParams>;
        
        /** Fields that can be sorted */
        sortableFields?: (keyof TEntity | string)[];
        
        /** Feature toggles */
        features?: {
            search?: boolean | SearchConfig;
            selection?: boolean;
            bulkActions?: string[] | BulkActionsConfig;
        };
        
        /** Pagination settings */
        pagination?: {
            defaultLimit?: number;
            maxLimit?: number;
        };
    };
}

export interface SearchConfig {
    enabled: boolean;
    debounceMs?: number;
    minLength?: number;
}

export interface BulkActionsConfig {
    actions: string[];
    maxSelectionForAction?: Record<string, number>;
}

export type FilterDefinitions<TParams> = {
    [K in keyof Omit<TParams, keyof BaseListParams>]?: FilterDefinition;
};

export interface FilterDefinition {
    type: "string" | "number" | "boolean" | "enum" | "date" | "dateRange";
    options?: string[] | number[];  // For enum type
    label?: string;
}
```

### 4.5 View Model Contract

```typescript
// core/list-module/contracts/ListViewModel.ts

export interface ListViewModel<TEntity extends { id: string }> {
    // === Data ===
    items: TEntity[];
    total: number | null;
    
    // === Query State ===
    search: string;
    filters: Record<string, unknown>;
    sort: SortParams | null;
    
    // === Loading States ===
    isInitialLoading: boolean;
    isLoading: boolean;
    isLoadingMore: boolean;
    isRefreshing: boolean;
    
    // === Pagination ===
    hasMore: boolean;
    cursor: string | null;
    
    // === Selection (if enabled) ===
    selection: SelectionState;
    
    // === Derived States ===
    isEmpty: boolean;
    isEmptyWithFilters: boolean;
    hasActiveFilters: boolean;
    
    // === Error State ===
    error: ListError | null;
}

export interface SelectionState {
    ids: ReadonlySet<string>;
    count: number;
    isAllSelected: boolean;
    isPartiallySelected: boolean;
    has(id: string): boolean;
}

export interface ListError {
    code: string;
    message: string;
    retryable: boolean;
}
```

### 4.6 Actions Contract

```typescript
// core/list-module/contracts/ListActions.ts

export interface ListActions<TParams extends BaseListParams> {
    search: SearchActions;
    filter: FilterActions<TParams>;
    sort: SortActions;
    selection: SelectionActions;
    bulk: BulkActions;
    
    /** Load more items (pagination) */
    loadMore(): Promise<void>;
    
    /** Refresh current data */
    refresh(): Promise<void>;
    
    /** Reset to initial state */
    reset(): void;
}

export interface SearchActions {
    set(query: string): void;
    clear(): void;
}

export interface FilterActions<TParams> {
    set<K extends keyof TParams>(key: K, value: TParams[K]): void;
    clear(key: keyof TParams): void;
    clearAll(): void;
    replace(filters: Partial<TParams>): void;
}

export interface SortActions {
    set(by: string, direction: "asc" | "desc"): void;
    toggle(by: string): void;  // Cycles: none → asc → desc → none
    clear(): void;
}

export interface SelectionActions {
    toggle(id: string): void;
    select(id: string): void;
    deselect(id: string): void;
    selectMultiple(ids: string[]): void;
    deselectMultiple(ids: string[]): void;
    selectAll(): void;
    deselectAll(): void;
    selectPage(): void;  // Select all items on current page
}

export interface BulkActions {
    execute(action: string): Promise<void>;
    canExecute(action: string): boolean;
    isExecuting(action: string): boolean;
}
```

---

## 5. Core Components Implementation

### 5.1 ListQueryParamsRepository

```typescript
// core/list-module/repositories/ListQueryParamsRepository.ts

import { makeAutoObservable, toJS } from "mobx";

export class ListQueryParamsRepository<TParams extends BaseListParams> {
    private params: TParams;
    private initialParams: TParams;
    private subscribers: Set<(params: TParams) => void> = new Set();

    constructor(initialParams: TParams) {
        this.initialParams = { ...initialParams };
        this.params = { ...initialParams };
        makeAutoObservable(this);
    }

    // === Getters ===
    
    get(): TParams {
        return toJS(this.params);
    }

    getSearch(): string {
        return this.params.search ?? "";
    }

    getSort(): SortParams | null {
        return this.params.sort ?? null;
    }

    getCursor(): string | null {
        return this.params.cursor ?? null;
    }

    // === Mutators ===
    
    set<K extends keyof TParams>(key: K, value: TParams[K]): void {
        this.params[key] = value;
        // Reset cursor when filters change (except for cursor itself)
        if (key !== "cursor") {
            this.params.cursor = null as TParams["cursor"];
        }
        this.notifySubscribers();
    }

    merge(partial: Partial<TParams>): void {
        Object.assign(this.params, partial);
        if (!("cursor" in partial)) {
            this.params.cursor = null as TParams["cursor"];
        }
        this.notifySubscribers();
    }

    replace(params: TParams): void {
        this.params = { ...params };
        this.notifySubscribers();
    }

    reset(): void {
        this.params = { ...this.initialParams };
        this.notifySubscribers();
    }

    // === Subscription ===
    
    subscribe(callback: (params: TParams) => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    private notifySubscribers(): void {
        const snapshot = this.get();
        this.subscribers.forEach(cb => cb(snapshot));
    }
}

export namespace ListQueryParamsRepository {
    export interface Interface<TParams extends BaseListParams> {
        get(): TParams;
        getSearch(): string;
        getSort(): SortParams | null;
        getCursor(): string | null;
        set<K extends keyof TParams>(key: K, value: TParams[K]): void;
        merge(partial: Partial<TParams>): void;
        replace(params: TParams): void;
        reset(): void;
        subscribe(callback: (params: TParams) => void): () => void;
    }
    
    export const Token = Symbol("ListQueryParamsRepository");
}
```

### 5.2 ListDataRepository

```typescript
// core/list-module/repositories/ListDataRepository.ts

import { makeAutoObservable, runInAction, toJS } from "mobx";

export class ListDataRepository<
    TEntity extends { id: string },
    TDto,
    TParams extends BaseListParams
> {
    private items: TEntity[] = [];
    private cursor: string | null = null;
    private total: number | null = null;
    private hasMore: boolean = false;

    constructor(
        private gateway: ListGateway.Interface<TDto, TParams>,
        private mapper: ListMapper.Interface<TDto, TEntity>
    ) {
        makeAutoObservable(this);
    }

    // === Getters ===
    
    getAll(): TEntity[] {
        return toJS(this.items);
    }

    getById(id: string): TEntity | undefined {
        return this.items.find(item => item.id === id);
    }

    getCursor(): string | null {
        return this.cursor;
    }

    getTotal(): number | null {
        return this.total;
    }

    getHasMore(): boolean {
        return this.hasMore;
    }

    // === Data Operations ===
    
    async load(params: TParams): Promise<void> {
        const response = await this.gateway.fetchList(params);
        
        runInAction(() => {
            this.items = response.items.map(dto => this.mapper.toDomain(dto));
            this.cursor = response.cursor;
            this.total = response.total ?? null;
            this.hasMore = response.hasMore;
        });
    }

    async append(params: TParams): Promise<void> {
        const response = await this.gateway.fetchList(params);
        
        runInAction(() => {
            const newItems = response.items.map(dto => this.mapper.toDomain(dto));
            this.items = [...this.items, ...newItems];
            this.cursor = response.cursor;
            this.hasMore = response.hasMore;
        });
    }

    clear(): void {
        this.items = [];
        this.cursor = null;
        this.total = null;
        this.hasMore = false;
    }

    // === Local Mutations (for optimistic updates) ===
    
    updateItem(id: string, updater: (item: TEntity) => TEntity): void {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items[index] = updater(this.items[index]);
        }
    }

    removeItem(id: string): void {
        this.items = this.items.filter(item => item.id !== id);
    }

    removeItems(ids: string[]): void {
        const idSet = new Set(ids);
        this.items = this.items.filter(item => !idSet.has(item.id));
    }
}

export namespace ListDataRepository {
    export interface Interface<TEntity extends { id: string }> {
        getAll(): TEntity[];
        getById(id: string): TEntity | undefined;
        getCursor(): string | null;
        getTotal(): number | null;
        getHasMore(): boolean;
        load(params: any): Promise<void>;
        append(params: any): Promise<void>;
        clear(): void;
        updateItem(id: string, updater: (item: TEntity) => TEntity): void;
        removeItem(id: string): void;
        removeItems(ids: string[]): void;
    }
    
    export const Token = Symbol("ListDataRepository");
}
```

### 5.3 LoadingRepository

```typescript
// core/list-module/repositories/LoadingRepository.ts

import { makeAutoObservable, runInAction } from "mobx";

export type LoadingAction = 
    | "initial" 
    | "reload" 
    | "loadMore" 
    | "refresh" 
    | "bulkAction";

export class LoadingRepository {
    private loadingStates: Map<string, boolean> = new Map();
    private errors: Map<string, ListError | null> = new Map();

    constructor() {
        makeAutoObservable(this);
    }

    isLoading(action: LoadingAction | string): boolean {
        return this.loadingStates.get(action) ?? false;
    }

    isAnyLoading(): boolean {
        return Array.from(this.loadingStates.values()).some(Boolean);
    }

    getError(action: LoadingAction | string): ListError | null {
        return this.errors.get(action) ?? null;
    }

    async runCallback<T>(
        promise: Promise<T>,
        action: LoadingAction | string
    ): Promise<T> {
        runInAction(() => {
            this.loadingStates.set(action, true);
            this.errors.set(action, null);
        });

        try {
            const result = await promise;
            runInAction(() => {
                this.loadingStates.set(action, false);
            });
            return result;
        } catch (error) {
            runInAction(() => {
                this.loadingStates.set(action, false);
                this.errors.set(action, this.normalizeError(error));
            });
            throw error;
        }
    }

    clearError(action: LoadingAction | string): void {
        this.errors.set(action, null);
    }

    clearAllErrors(): void {
        this.errors.clear();
    }

    private normalizeError(error: unknown): ListError {
        if (error instanceof Error) {
            return {
                code: "UNKNOWN",
                message: error.message,
                retryable: true
            };
        }
        return {
            code: "UNKNOWN",
            message: String(error),
            retryable: true
        };
    }
}

export namespace LoadingRepository {
    export interface Interface {
        isLoading(action: LoadingAction | string): boolean;
        isAnyLoading(): boolean;
        getError(action: LoadingAction | string): ListError | null;
        runCallback<T>(promise: Promise<T>, action: LoadingAction | string): Promise<T>;
        clearError(action: LoadingAction | string): void;
        clearAllErrors(): void;
    }
    
    export const Token = Symbol("LoadingRepository");
}
```

### 5.4 SelectionRepository

```typescript
// core/list-module/repositories/SelectionRepository.ts

import { makeAutoObservable, toJS } from "mobx";

export class SelectionRepository {
    private selected: Set<string> = new Set();

    constructor() {
        makeAutoObservable(this);
    }

    // === Getters ===
    
    getSelected(): Set<string> {
        return new Set(this.selected);
    }

    getSelectedArray(): string[] {
        return Array.from(this.selected);
    }

    getCount(): number {
        return this.selected.size;
    }

    has(id: string): boolean {
        return this.selected.has(id);
    }

    isEmpty(): boolean {
        return this.selected.size === 0;
    }

    // === Mutators ===
    
    select(id: string): void {
        this.selected.add(id);
    }

    deselect(id: string): void {
        this.selected.delete(id);
    }

    toggle(id: string): void {
        if (this.selected.has(id)) {
            this.selected.delete(id);
        } else {
            this.selected.add(id);
        }
    }

    selectMultiple(ids: string[]): void {
        ids.forEach(id => this.selected.add(id));
    }

    deselectMultiple(ids: string[]): void {
        ids.forEach(id => this.selected.delete(id));
    }

    clear(): void {
        this.selected.clear();
    }

    replace(ids: string[]): void {
        this.selected = new Set(ids);
    }
}

export namespace SelectionRepository {
    export interface Interface {
        getSelected(): Set<string>;
        getSelectedArray(): string[];
        getCount(): number;
        has(id: string): boolean;
        isEmpty(): boolean;
        select(id: string): void;
        deselect(id: string): void;
        toggle(id: string): void;
        selectMultiple(ids: string[]): void;
        deselectMultiple(ids: string[]): void;
        clear(): void;
        replace(ids: string[]): void;
    }
    
    export const Token = Symbol("SelectionRepository");
}
```

---

## 6. Factory Implementation

### 6.1 createListModule Function

```typescript
// core/list-module/createListModule.ts

import { Container } from "your-di-library";  // e.g., tsyringe, inversify

export function createListModule<
    TEntity extends { id: string },
    TDto,
    TParams extends BaseListParams
>(
    moduleConfig: ListModuleConfig<TEntity, TDto, TParams>
): ListModule<TEntity, TParams> {
    
    const { name, gateway, mapper, presenter, config } = moduleConfig;
    
    // Create tokens unique to this module
    const tokens = createModuleTokens(name);
    
    // Factory for creating container instances
    function createContainer(): Container {
        const container = new Container();
        
        // === Register Repositories ===
        container.registerSingleton(
            tokens.queryParams,
            () => new ListQueryParamsRepository<TParams>(
                config.initialParams as TParams
            )
        );
        
        container.registerSingleton(
            tokens.loading,
            () => new LoadingRepository()
        );
        
        if (config.features?.selection) {
            container.registerSingleton(
                tokens.selection,
                () => new SelectionRepository()
            );
        }
        
        // === Register Infrastructure ===
        container.registerSingleton(tokens.gateway, gateway);
        container.registerSingleton(tokens.mapper, mapper);
        
        // === Register Data Repository ===
        container.registerSingleton(
            tokens.dataRepository,
            (c) => new ListDataRepository<TEntity, TDto, TParams>(
                c.resolve(tokens.gateway),
                c.resolve(tokens.mapper)
            )
        );
        
        // === Register Features ===
        registerFeatures(container, tokens, config);
        
        // === Register Presenter ===
        const PresenterClass = presenter ?? GenericListPresenter;
        container.registerSingleton(
            tokens.presenter,
            (c) => new PresenterClass(
                c.resolve(tokens.dataRepository),
                c.resolve(tokens.queryParams),
                c.resolve(tokens.loading),
                config.features?.selection ? c.resolve(tokens.selection) : null,
                config
            )
        );
        
        return container;
    }
    
    // React hook factory
    function useList(): UseListResult<TEntity, TParams> {
        return useListModule(createContainer, tokens);
    }
    
    return {
        name,
        useList,
        createContainer,
        tokens
    };
}

function createModuleTokens(name: string): ModuleTokens {
    return {
        queryParams: Symbol(`${name}:QueryParams`),
        dataRepository: Symbol(`${name}:DataRepository`),
        loading: Symbol(`${name}:Loading`),
        selection: Symbol(`${name}:Selection`),
        gateway: Symbol(`${name}:Gateway`),
        mapper: Symbol(`${name}:Mapper`),
        presenter: Symbol(`${name}:Presenter`),
        features: {
            search: Symbol(`${name}:SearchFeature`),
            filter: Symbol(`${name}:FilterFeature`),
            sort: Symbol(`${name}:SortFeature`),
            loadMore: Symbol(`${name}:LoadMoreFeature`),
            selection: Symbol(`${name}:SelectionFeature`),
            bulkActions: Symbol(`${name}:BulkActionsFeature`)
        }
    };
}

function registerFeatures(
    container: Container,
    tokens: ModuleTokens,
    config: ListModuleConfig["config"]
): void {
    // Search Feature
    if (config.features?.search !== false) {
        container.register(
            tokens.features.search,
            (c) => new SearchFeature(
                c.resolve(tokens.queryParams),
                typeof config.features?.search === "object" 
                    ? config.features.search 
                    : {}
            )
        );
    }
    
    // Filter Feature
    container.register(
        tokens.features.filter,
        (c) => new FilterFeature(c.resolve(tokens.queryParams))
    );
    
    // Sort Feature
    container.register(
        tokens.features.sort,
        (c) => new SortFeature(
            c.resolve(tokens.queryParams),
            config.sortableFields ?? []
        )
    );
    
    // Load More Feature
    container.register(
        tokens.features.loadMore,
        (c) => new LoadMoreFeature(
            c.resolve(tokens.queryParams),
            c.resolve(tokens.dataRepository)
        )
    );
    
    // Selection Feature (if enabled)
    if (config.features?.selection) {
        container.register(
            tokens.features.selection,
            (c) => new SelectionFeature(c.resolve(tokens.selection))
        );
        
        container.register(
            tokens.features.bulkActions,
            (c) => new BulkActionsFeature(
                c.resolve(tokens.selection),
                c.resolve(tokens.dataRepository),
                c.resolve(tokens.loading),
                config.features?.bulkActions
            )
        );
    }
}
```

### 6.2 Generic List Presenter

```typescript
// core/list-module/presenter/GenericListPresenter.ts

import { makeAutoObservable, computed, toJS, reaction } from "mobx";

export class GenericListPresenter<
    TEntity extends { id: string },
    TParams extends BaseListParams
> {
    private disposers: (() => void)[] = [];
    private initialLoadDone = false;

    constructor(
        protected readonly repository: ListDataRepository.Interface<TEntity>,
        protected readonly queryParams: ListQueryParamsRepository.Interface<TParams>,
        protected readonly loading: LoadingRepository.Interface,
        protected readonly selection: SelectionRepository.Interface | null,
        protected readonly config: ListModuleConfig["config"]
    ) {
        makeAutoObservable(this, {
            vm: computed
        });
        
        this.setupReactions();
    }

    // === Setup ===
    
    private setupReactions(): void {
        // React to query param changes → reload data
        const unsubscribe = this.queryParams.subscribe(async (params) => {
            // Skip if this is just a cursor update (load more)
            if (this.isLoadMoreOperation(params)) {
                return;
            }
            
            await this.reload(params);
        });
        
        this.disposers.push(unsubscribe);
    }

    private isLoadMoreOperation(params: TParams): boolean {
        // If cursor is set, it's a load more operation
        return params.cursor != null;
    }

    // === Lifecycle ===
    
    async initialize(): Promise<void> {
        if (this.initialLoadDone) return;
        
        await this.loading.runCallback(
            this.repository.load(this.queryParams.get()),
            "initial"
        );
        
        this.initialLoadDone = true;
    }

    dispose(): void {
        this.disposers.forEach(dispose => dispose());
        this.disposers = [];
    }

    // === Actions ===
    
    async reload(params?: TParams): Promise<void> {
        const paramsToUse = params ?? this.queryParams.get();
        
        await this.loading.runCallback(
            this.repository.load(paramsToUse),
            "reload"
        );
    }

    async loadMore(): Promise<void> {
        const currentParams = this.queryParams.get();
        const cursor = this.repository.getCursor();
        
        if (!cursor || !this.repository.getHasMore()) {
            return;
        }

        const paramsWithCursor: TParams = {
            ...currentParams,
            cursor
        };

        await this.loading.runCallback(
            this.repository.append(paramsWithCursor),
            "loadMore"
        );
    }

    async refresh(): Promise<void> {
        // Reset cursor and reload
        this.queryParams.set("cursor", null as TParams["cursor"]);
        
        await this.loading.runCallback(
            this.repository.load(this.queryParams.get()),
            "refresh"
        );
    }

    reset(): void {
        this.queryParams.reset();
        this.repository.clear();
        this.selection?.clear();
        this.loading.clearAllErrors();
        this.initialLoadDone = false;
    }

    // === View Model ===
    
    get vm(): ListViewModel<TEntity> {
        const items = this.repository.getAll();
        const params = this.queryParams.get();
        
        return {
            // Data
            items,
            total: this.repository.getTotal(),
            
            // Query state
            search: params.search ?? "",
            filters: this.extractFilters(params),
            sort: params.sort ?? null,
            
            // Loading states
            isInitialLoading: !this.initialLoadDone && this.loading.isLoading("initial"),
            isLoading: this.loading.isLoading("reload"),
            isLoadingMore: this.loading.isLoading("loadMore"),
            isRefreshing: this.loading.isLoading("refresh"),
            
            // Pagination
            hasMore: this.repository.getHasMore(),
            cursor: this.repository.getCursor(),
            
            // Selection
            selection: this.computeSelectionState(items),
            
            // Derived states
            isEmpty: items.length === 0 && !this.loading.isAnyLoading(),
            isEmptyWithFilters: items.length === 0 && this.hasActiveFilters(params),
            hasActiveFilters: this.hasActiveFilters(params),
            
            // Errors
            error: this.loading.getError("reload") ?? this.loading.getError("initial")
        };
    }

    // === Protected Helpers (for extension) ===
    
    protected extractFilters(params: TParams): Record<string, unknown> {
        const { search, sort, cursor, limit, ...filters } = params as any;
        return filters;
    }

    protected hasActiveFilters(params: TParams): boolean {
        const filters = this.extractFilters(params);
        return Object.values(filters).some(v => v != null && v !== "");
    }

    protected computeSelectionState(items: TEntity[]): SelectionState {
        if (!this.selection) {
            return {
                ids: new Set(),
                count: 0,
                isAllSelected: false,
                isPartiallySelected: false,
                has: () => false
            };
        }

        const selectedIds = this.selection.getSelected();
        const itemIds = new Set(items.map(i => i.id));
        const selectedOnPage = [...selectedIds].filter(id => itemIds.has(id));
        
        return {
            ids: selectedIds,
            count: selectedIds.size,
            isAllSelected: items.length > 0 && selectedOnPage.length === items.length,
            isPartiallySelected: selectedOnPage.length > 0 && selectedOnPage.length < items.length,
            has: (id: string) => selectedIds.has(id)
        };
    }
}

export namespace GenericListPresenter {
    export interface Interface<TEntity extends { id: string }> {
        vm: ListViewModel<TEntity>;
        initialize(): Promise<void>;
        dispose(): void;
        loadMore(): Promise<void>;
        refresh(): Promise<void>;
        reset(): void;
    }
    
    export const Token = Symbol("GenericListPresenter");
}
```

---

## 7. React Integration

### 7.1 useListModule Hook

```typescript
// core/list-module/hooks/useListModule.ts

import { useEffect, useMemo, useRef } from "react";
import { observer } from "mobx-react-lite";

export function useListModule<
    TEntity extends { id: string },
    TParams extends BaseListParams
>(
    createContainer: () => Container,
    tokens: ModuleTokens
): UseListResult<TEntity, TParams> {
    // Create container once per component instance
    const containerRef = useRef<Container | null>(null);
    
    if (!containerRef.current) {
        containerRef.current = createContainer();
    }
    
    const container = containerRef.current;
    
    // Resolve dependencies
    const presenter = useMemo(
        () => container.resolve<GenericListPresenter.Interface<TEntity>>(tokens.presenter),
        [container]
    );
    
    const features = useMemo(() => ({
        search: container.resolve<SearchFeature>(tokens.features.search),
        filter: container.resolve<FilterFeature<TParams>>(tokens.features.filter),
        sort: container.resolve<SortFeature>(tokens.features.sort),
        loadMore: container.resolve<LoadMoreFeature>(tokens.features.loadMore),
        selection: container.tryResolve<SelectionFeature>(tokens.features.selection),
        bulkActions: container.tryResolve<BulkActionsFeature>(tokens.features.bulkActions)
    }), [container]);
    
    // Initialize on mount
    useEffect(() => {
        presenter.initialize();
        
        return () => {
            presenter.dispose();
        };
    }, [presenter]);
    
    // Build actions object
    const actions = useMemo<ListActions<TParams>>(() => ({
        search: {
            set: (query: string) => features.search?.setSearch(query),
            clear: () => features.search?.clearSearch()
        },
        filter: {
            set: (key, value) => features.filter.setFilter(key, value),
            clear: (key) => features.filter.clearFilter(key),
            clearAll: () => features.filter.clearAllFilters(),
            replace: (filters) => features.filter.replaceFilters(filters)
        },
        sort: {
            set: (by, direction) => features.sort.setSort(by, direction),
            toggle: (by) => features.sort.toggleSort(by),
            clear: () => features.sort.clearSort()
        },
        selection: {
            toggle: (id) => features.selection?.toggle(id),
            select: (id) => features.selection?.select(id),
            deselect: (id) => features.selection?.deselect(id),
            selectMultiple: (ids) => features.selection?.selectMultiple(ids),
            deselectMultiple: (ids) => features.selection?.deselectMultiple(ids),
            selectAll: () => {
                const allIds = presenter.vm.items.map(i => i.id);
                features.selection?.selectMultiple(allIds);
            },
            deselectAll: () => features.selection?.deselectAll(),
            selectPage: () => {
                const pageIds = presenter.vm.items.map(i => i.id);
                features.selection?.selectMultiple(pageIds);
            }
        },
        bulk: {
            execute: (action) => features.bulkActions?.execute(action) ?? Promise.resolve(),
            canExecute: (action) => features.bulkActions?.canExecute(action) ?? false,
            isExecuting: (action) => features.bulkActions?.isExecuting(action) ?? false
        },
        loadMore: () => presenter.loadMore(),
        refresh: () => presenter.refresh(),
        reset: () => presenter.reset()
    }), [presenter, features]);
    
    return {
        vm: presenter.vm,
        actions
    };
}

export interface UseListResult<
    TEntity extends { id: string },
    TParams extends BaseListParams
> {
    vm: ListViewModel<TEntity>;
    actions: ListActions<TParams>;
}
```

### 7.2 Higher-Order Component (Optional)

```typescript
// core/list-module/hooks/withListModule.tsx

export function withListModule<
    TEntity extends { id: string },
    TParams extends BaseListParams,
    TProps extends object
>(
    module: ListModule<TEntity, TParams>
) {
    return function<P extends TProps>(
        WrappedComponent: React.ComponentType<P & UseListResult<TEntity, TParams>>
    ): React.FC<Omit<P, keyof UseListResult<TEntity, TParams>>> {
        return observer(function WithListModule(props) {
            const listResult = module.useList();
            
            return <WrappedComponent {...props as P} {...listResult} />;
        });
    };
}
```

---

## 8. Implementation Phases

### Phase 1: Core Foundation (Week 1-2)

**Deliverables:**
- [ ] Base types and interfaces (`BaseListParams`, `ListResponse`, etc.)
- [ ] `ListQueryParamsRepository` implementation
- [ ] `ListDataRepository` implementation
- [ ] `LoadingRepository` implementation
- [ ] Unit tests for all repositories

**Acceptance Criteria:**
- Repositories can be instantiated independently
- All repository methods work correctly
- 90%+ test coverage

---

### Phase 2: Features Layer (Week 2-3)

**Deliverables:**
- [ ] `SearchFeature` with debouncing
- [ ] `FilterFeature` with type-safe filter operations
- [ ] `SortFeature` with toggle behavior
- [ ] `LoadMoreFeature` with cursor management
- [ ] Unit tests for all features

**Acceptance Criteria:**
- Features correctly update `ListQueryParamsRepository`
- Search debouncing works correctly
- Sort toggle cycles through states properly
- 90%+ test coverage

---

### Phase 3: Presenter & Factory (Week 3-4)

**Deliverables:**
- [ ] `GenericListPresenter` implementation
- [ ] `createListModule()` factory function
- [ ] DI container configuration
- [ ] Module tokens system
- [ ] Integration tests

**Acceptance Criteria:**
- Factory creates fully configured modules
- Presenter VM updates reactively
- All features integrate correctly
- Presenter can be extended via subclassing

---

### Phase 4: React Integration (Week 4-5)

**Deliverables:**
- [ ] `useListModule` hook
- [ ] `ListActions` builder
- [ ] Lifecycle management (init/dispose)
- [ ] Example React component
- [ ] Integration tests with React Testing Library

**Acceptance Criteria:**
- Hook provides reactive `vm` and `actions`
- Component unmount properly disposes resources
- No memory leaks on re-renders
- Works with React StrictMode

---

### Phase 5: Selection & Bulk Actions (Week 5-6)

**Deliverables:**
- [ ] `SelectionRepository` implementation
- [ ] `SelectionFeature` implementation
- [ ] `BulkActionsFeature` implementation
- [ ] Selection state in VM
- [ ] Unit and integration tests

**Acceptance Criteria:**
- Selection persists across pagination
- Bulk actions receive correct selected items
- Selection UI state (all/partial/none) computed correctly
- Selection can be optionally disabled

---

### Phase 6: Error Handling & Edge Cases (Week 6-7)

**Deliverables:**
- [ ] Error state in repositories and presenter
- [ ] Retry logic for failed requests
- [ ] Empty state handling
- [ ] Stale data indicators
- [ ] Error boundary integration

**Acceptance Criteria:**
- Errors are captured and exposed in VM
- Retry action available after failures
- Empty states distinguish between "no data" and "no results for filter"
- Loading states don't conflict with error states

---

### Phase 7: Documentation & Examples (Week 7-8)

**Deliverables:**
- [ ] API documentation for all public interfaces
- [ ] Developer guide for creating new modules
- [ ] Example module: Pages List
- [ ] Example module: Redirects List
- [ ] Troubleshooting guide

**Acceptance Criteria:**
- New developer can create a module without reading source code
- All public APIs documented
- Examples cover common use cases
- Migration guide from old patterns

---

## 9. Example Module: Pages List

### 9.1 Types

```typescript
// modules/pages/types.ts

export interface Page {
    id: string;
    title: string;
    slug: string;
    status: PageStatus;
    author: {
        id: string;
        name: string;
    };
    publishedAt: Date | null;
    updatedAt: Date;
    createdAt: Date;
}

export type PageStatus = "draft" | "published" | "archived";

export interface PageDTO {
    id: string;
    title: string;
    slug: string;
    status: string;
    author_id: string;
    author_name: string;
    published_at: string | null;
    updated_at: string;
    created_at: string;
}

export interface PageQueryParams extends BaseListParams {
    status?: PageStatus;
    authorId?: string;
    publishedAfter?: string;
    publishedBefore?: string;
}
```

### 9.2 Gateway

```typescript
// modules/pages/PagesGateway.ts

import { inject, injectable } from "your-di-library";
import { ApiClient } from "@/shared/api";
import { ListGateway, ListResponse } from "@/core/list-module";
import { PageDTO, PageQueryParams } from "./types";

@injectable()
export class PagesGateway implements ListGateway<PageDTO, PageQueryParams> {
    constructor(
        @inject(ApiClient) private api: ApiClient
    ) {}

    async fetchList(params: PageQueryParams): Promise<ListResponse<PageDTO>> {
        const response = await this.api.get<{
            pages: PageDTO[];
            next_cursor: string | null;
            total: number;
            has_more: boolean;
        }>("/api/pages", {
            params: this.transformParams(params)
        });

        return {
            items: response.data.pages,
            cursor: response.data.next_cursor,
            total: response.data.total,
            hasMore: response.data.has_more
        };
    }

    private transformParams(params: PageQueryParams): Record<string, string> {
        const result: Record<string, string> = {};
        
        if (params.search) result.q = params.search;
        if (params.status) result.status = params.status;
        if (params.authorId) result.author_id = params.authorId;
        if (params.sort) {
            result.sort_by = params.sort.by;
            result.sort_dir = params.sort.direction;
        }
        if (params.cursor) result.cursor = params.cursor;
        if (params.limit) result.limit = String(params.limit);
        if (params.publishedAfter) result.published_after = params.publishedAfter;
        if (params.publishedBefore) result.published_before = params.publishedBefore;
        
        return result;
    }
}
```

### 9.3 Mapper

```typescript
// modules/pages/PageMapper.ts

import { injectable } from "your-di-library";
import { ListMapper } from "@/core/list-module";
import { Page, PageDTO, PageStatus } from "./types";

@injectable()
export class PageMapper implements ListMapper<PageDTO, Page> {
    toDomain(dto: PageDTO): Page {
        return {
            id: dto.id,
            title: dto.title,
            slug: dto.slug,
            status: dto.status as PageStatus,
            author: {
                id: dto.author_id,
                name: dto.author_name
            },
            publishedAt: dto.published_at ? new Date(dto.published_at) : null,
            updatedAt: new Date(dto.updated_at),
            createdAt: new Date(dto.created_at)
        };
    }

    toDto(page: Page): PageDTO {
        return {
            id: page.id,
            title: page.title,
            slug: page.slug,
            status: page.status,
            author_id: page.author.id,
            author_name: page.author.name,
            published_at: page.publishedAt?.toISOString() ?? null,
            updated_at: page.updatedAt.toISOString(),
            created_at: page.createdAt.toISOString()
        };
    }
}
```

### 9.4 Module Definition

```typescript
// modules/pages/index.ts

import { createListModule } from "@/core/list-module";
import { Page, PageDTO, PageQueryParams } from "./types";
import { PagesGateway } from "./PagesGateway";
import { PageMapper } from "./PageMapper";

export const PagesListModule = createListModule<Page, PageDTO, PageQueryParams>({
    name: "pages",
    
    gateway: PagesGateway,
    mapper: PageMapper,
    
    config: {
        initialParams: {
            limit: 20,
            sort: { by: "updatedAt", direction: "desc" }
        },
        
        filters: {
            status: { 
                type: "enum", 
                options: ["draft", "published", "archived"],
                label: "Status"
            },
            authorId: { 
                type: "string",
                label: "Author"
            },
            publishedAfter: {
                type: "date",
                label: "Published After"
            },
            publishedBefore: {
                type: "date",
                label: "Published Before"
            }
        },
        
        sortableFields: ["title", "updatedAt", "publishedAt", "status"],
        
        features: {
            search: {
                enabled: true,
                debounceMs: 300,
                minLength: 2
            },
            selection: true,
            bulkActions: ["delete", "publish", "unpublish", "archive"]
        },
        
        pagination: {
            defaultLimit: 20,
            maxLimit: 100
        }
    }
});

// Re-export types for consumers
export type { Page, PageDTO, PageQueryParams } from "./types";
```

### 9.5 React View

```typescript
// modules/pages/PagesListView.tsx

import { observer } from "mobx-react-lite";
import { PagesListModule } from "./index";

export const PagesListView = observer(function PagesListView() {
    const { vm, actions } = PagesListModule.useList();

    return (
        <div className="pages-list">
            {/* Header */}
            <header className="pages-list__header">
                <h1>Pages</h1>
                
                {/* Search */}
                <input
                    type="search"
                    value={vm.search}
                    onChange={(e) => actions.search.set(e.target.value)}
                    placeholder="Search pages..."
                    className="pages-list__search"
                />
            </header>

            {/* Filters */}
            <div className="pages-list__filters">
                <select
                    value={vm.filters.status as string ?? ""}
                    onChange={(e) => actions.filter.set("status", e.target.value || undefined)}
                >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                </select>
                
                {vm.hasActiveFilters && (
                    <button onClick={actions.filter.clearAll}>
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Bulk Actions */}
            {vm.selection.count > 0 && (
                <div className="pages-list__bulk-actions">
                    <span>{vm.selection.count} selected</span>
                    
                    <button
                        onClick={() => actions.bulk.execute("publish")}
                        disabled={actions.bulk.isExecuting("publish")}
                    >
                        Publish
                    </button>
                    
                    <button
                        onClick={() => actions.bulk.execute("delete")}
                        disabled={actions.bulk.isExecuting("delete")}
                    >
                        Delete
                    </button>
                    
                    <button onClick={actions.selection.deselectAll}>
                        Cancel
                    </button>
                </div>
            )}

            {/* Error State */}
            {vm.error && (
                <div className="pages-list__error">
                    <p>{vm.error.message}</p>
                    {vm.error.retryable && (
                        <button onClick={actions.refresh}>Retry</button>
                    )}
                </div>
            )}

            {/* Loading State */}
            {vm.isInitialLoading && (
                <div className="pages-list__loading">
                    <Spinner />
                </div>
            )}

            {/* Empty State */}
            {vm.isEmpty && !vm.isInitialLoading && (
                <div className="pages-list__empty">
                    {vm.isEmptyWithFilters ? (
                        <>
                            <p>No pages match your filters</p>
                            <button onClick={actions.filter.clearAll}>
                                Clear Filters
                            </button>
                        </>
                    ) : (
                        <>
                            <p>No pages yet</p>
                            <button>Create your first page</button>
                        </>
                    )}
                </div>
            )}

            {/* Table */}
            {!vm.isEmpty && !vm.isInitialLoading && (
                <table className="pages-list__table">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={vm.selection.isAllSelected}
                                    indeterminate={vm.selection.isPartiallySelected}
                                    onChange={() => 
                                        vm.selection.isAllSelected
                                            ? actions.selection.deselectAll()
                                            : actions.selection.selectPage()
                                    }
                                />
                            </th>
                            <SortableHeader
                                label="Title"
                                field="title"
                                sort={vm.sort}
                                onSort={actions.sort.toggle}
                            />
                            <SortableHeader
                                label="Status"
                                field="status"
                                sort={vm.sort}
                                onSort={actions.sort.toggle}
                            />
                            <SortableHeader
                                label="Updated"
                                field="updatedAt"
                                sort={vm.sort}
                                onSort={actions.sort.toggle}
                            />
                            <th>Author</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vm.items.map(page => (
                            <tr key={page.id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={vm.selection.has(page.id)}
                                        onChange={() => actions.selection.toggle(page.id)}
                                    />
                                </td>
                                <td>{page.title}</td>
                                <td>
                                    <StatusBadge status={page.status} />
                                </td>
                                <td>{formatDate(page.updatedAt)}</td>
                                <td>{page.author.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Load More */}
            {vm.hasMore && (
                <div className="pages-list__load-more">
                    <button
                        onClick={actions.loadMore}
                        disabled={vm.isLoadingMore}
                    >
                        {vm.isLoadingMore ? "Loading..." : "Load More"}
                    </button>
                </div>
            )}

            {/* Footer */}
            {vm.total != null && (
                <footer className="pages-list__footer">
                    Showing {vm.items.length} of {vm.total} pages
                </footer>
            )}
        </div>
    );
});

// Helper component
function SortableHeader({ 
    label, 
    field, 
    sort, 
    onSort 
}: { 
    label: string;
    field: string;
    sort: SortParams | null;
    onSort: (field: string) => void;
}) {
    const isActive = sort?.by === field;
    const direction = isActive ? sort.direction : null;
    
    return (
        <th 
            onClick={() => onSort(field)}
            className="sortable"
        >
            {label}
            {direction === "asc" && " ↑"}
            {direction === "desc" && " ↓"}
        </th>
    );
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests (Repositories)

```typescript
// core/list-module/__tests__/repositories/ListQueryParamsRepository.test.ts

describe("ListQueryParamsRepository", () => {
    let repository: ListQueryParamsRepository<TestParams>;
    
    beforeEach(() => {
        repository = new ListQueryParamsRepository({
            limit: 20,
            search: "",
            status: null
        });
    });
    
    describe("get()", () => {
        it("should return current params", () => {
            expect(repository.get()).toEqual({
                limit: 20,
                search: "",
                status: null
            });
        });
    });
    
    describe("set()", () => {
        it("should update a single param", () => {
            repository.set("search", "test");
            expect(repository.getSearch()).toBe("test");
        });
        
        it("should reset cursor when non-cursor param changes", () => {
            repository.set("cursor", "abc123");
            repository.set("search", "test");
            expect(repository.getCursor()).toBeNull();
        });
        
        it("should not reset cursor when cursor is updated", () => {
            repository.set("cursor", "abc123");
            expect(repository.getCursor()).toBe("abc123");
        });
    });
    
    describe("subscribe()", () => {
        it("should notify subscribers on change", () => {
            const callback = vi.fn();
            repository.subscribe(callback);
            
            repository.set("search", "test");
            
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({ search: "test" })
            );
        });
        
        it("should allow unsubscribe", () => {
            const callback = vi.fn();
            const unsubscribe = repository.subscribe(callback);
            
            unsubscribe();
            repository.set("search", "test");
            
            expect(callback).not.toHaveBeenCalled();
        });
    });
    
    describe("reset()", () => {
        it("should restore initial params", () => {
            repository.set("search", "test");
            repository.set("status", "active");
            
            repository.reset();
            
            expect(repository.get()).toEqual({
                limit: 20,
                search: "",
                status: null
            });
        });
    });
});
```

### 10.2 Unit Tests (Features)

```typescript
// core/list-module/__tests__/features/SearchFeature.test.ts

describe("SearchFeature", () => {
    let searchFeature: SearchFeature;
    let queryParamsRepo: MockListQueryParamsRepository;
    
    beforeEach(() => {
        queryParamsRepo = new MockListQueryParamsRepository();
        searchFeature = new SearchFeature(queryParamsRepo, {
            debounceMs: 0  // Disable debounce for tests
        });
    });
    
    describe("setSearch()", () => {
        it("should update search param", () => {
            searchFeature.setSearch("hello");
            
            expect(queryParamsRepo.set).toHaveBeenCalledWith("search", "hello");
        });
        
        it("should trim whitespace", () => {
            searchFeature.setSearch("  hello  ");
            
            expect(queryParamsRepo.set).toHaveBeenCalledWith("search", "hello");
        });
    });
    
    describe("clearSearch()", () => {
        it("should set search to empty string", () => {
            searchFeature.clearSearch();
            
            expect(queryParamsRepo.set).toHaveBeenCalledWith("search", "");
        });
    });
    
    describe("debouncing", () => {
        it("should debounce rapid calls", async () => {
            const debouncedFeature = new SearchFeature(queryParamsRepo, {
                debounceMs: 100
            });
            
            debouncedFeature.setSearch("a");
            debouncedFeature.setSearch("ab");
            debouncedFeature.setSearch("abc");
            
            await wait(150);
            
            expect(queryParamsRepo.set).toHaveBeenCalledTimes(1);
            expect(queryParamsRepo.set).toHaveBeenCalledWith("search", "abc");
        });
    });
});
```

### 10.3 Integration Tests

```typescript
// core/list-module/__tests__/integration/createListModule.test.ts

describe("createListModule integration", () => {
    let module: ListModule<TestEntity, TestParams>;
    let mockGateway: MockGateway;
    
    beforeEach(() => {
        mockGateway = new MockGateway();
        mockGateway.fetchList.mockResolvedValue({
            items: [
                { id: "1", name: "Item 1" },
                { id: "2", name: "Item 2" }
            ],
            cursor: "next",
            hasMore: true,
            total: 10
        });
        
        module = createListModule({
            name: "test",
            gateway: () => mockGateway,
            mapper: TestMapper,
            config: {
                initialParams: { limit: 20 },
                features: {
                    search: true,
                    selection: true
                }
            }
        });
    });
    
    it("should load initial data on hook mount", async () => {
        const { result } = renderHook(() => module.useList());
        
        await waitFor(() => {
            expect(result.current.vm.items).toHaveLength(2);
        });
        
        expect(mockGateway.fetchList).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 20 })
        );
    });
    
    it("should reload when search changes", async () => {
        const { result } = renderHook(() => module.useList());
        
        await waitFor(() => {
            expect(result.current.vm.items).toHaveLength(2);
        });
        
        act(() => {
            result.current.actions.search.set("test");
        });
        
        await waitFor(() => {
            expect(mockGateway.fetchList).toHaveBeenCalledWith(
                expect.objectContaining({ search: "test" })
            );
        });
    });
    
    it("should append items on loadMore", async () => {
        const { result } = renderHook(() => module.useList());
        
        await waitFor(() => {
            expect(result.current.vm.hasMore).toBe(true);
        });
        
        mockGateway.fetchList.mockResolvedValueOnce({
            items: [{ id: "3", name: "Item 3" }],
            cursor: null,
            hasMore: false,
            total: 10
        });
        
        await act(async () => {
            await result.current.actions.loadMore();
        });
        
        expect(result.current.vm.items).toHaveLength(3);
        expect(result.current.vm.hasMore).toBe(false);
    });
    
    it("should track selection state", async () => {
        const { result } = renderHook(() => module.useList());
        
        await waitFor(() => {
            expect(result.current.vm.items).toHaveLength(2);
        });
        
        act(() => {
            result.current.actions.selection.toggle("1");
        });
        
        expect(result.current.vm.selection.has("1")).toBe(true);
        expect(result.current.vm.selection.count).toBe(1);
        
        act(() => {
            result.current.actions.selection.selectPage();
        });
        
        expect(result.current.vm.selection.isAllSelected).toBe(true);
    });
});
```

### 10.4 Test Coverage Requirements

| Component | Min Coverage |
|-----------|--------------|
| Repositories | 95% |
| Features | 90% |
| Presenter | 90% |
| Factory | 85% |
| React Hook | 80% |
| Integration | 75% |

---

## 11. Migration Guide

### From Old Pattern to List Module

**Before (Manual Implementation):**

```typescript
// Old pattern - ~300 lines of boilerplate
class PagesQueryParamsRepository { ... }
class PagesRepository { ... }
class PagesLoadingRepository { ... }
class PagesSearchFeature { ... }
class PagesFilterFeature { ... }
class PagesSortFeature { ... }
class PagesLoadMoreFeature { ... }
class PagesPresenter { ... }

function usePagesList() {
    // Manual DI setup
    // Manual hook composition
    // ~100 lines
}
```

**After (List Module):**

```typescript
// New pattern - ~50 lines
export const PagesListModule = createListModule<Page, PageDTO, PageQueryParams>({
    name: "pages",
    gateway: PagesGateway,
    mapper: PageMapper,
    config: { /* ... */ }
});

// Usage
const { vm, actions } = PagesListModule.useList();
```

### Migration Steps

1. **Create types file** with Entity, DTO, and QueryParams
2. **Extract Gateway** from existing repository (only the fetch logic)
3. **Extract Mapper** from existing repository (only the transformation)
4. **Create module** with `createListModule()`
5. **Update views** to use new `vm` and `actions` API
6. **Delete old** repositories, features, and presenters
7. **Run tests** and verify behavior matches

### API Mapping

| Old API | New API |
|---------|---------|
| `presenter.vm.items` | `vm.items` |
| `presenter.vm.isLoading` | `vm.isLoading` |
| `searchFeature.setSearch()` | `actions.search.set()` |
| `filterFeature.setFilter()` | `actions.filter.set()` |
| `sortFeature.setSort()` | `actions.sort.set()` |
| `loadMoreFeature.loadMore()` | `actions.loadMore()` |
| `selectionFeature.toggle()` | `actions.selection.toggle()` |

---

## Appendix: Glossary

| Term | Definition |
|------|------------|
| **Module** | A complete, self-contained list feature package |
| **Gateway** | Infrastructure layer that makes API calls |
| **Mapper** | Transforms DTOs to domain entities |
| **Repository** | Manages observable state |
| **Feature** | Headless service that performs one action |
| **Presenter** | Orchestrates data flow and generates VM |
| **VM (View Model)** | Read-only snapshot of UI state |
| **Actions** | Methods the UI can call to trigger changes |

---

## Appendix: Checklist for New Modules

- [ ] Define Entity type (domain model)
- [ ] Define DTO type (API response shape)
- [ ] Define QueryParams type (extends BaseListParams)
- [ ] Implement Gateway (fetchList method)
- [ ] Implement Mapper (toDomain method)
- [ ] Configure module (filters, sort, features)
- [ ] Create view component
- [ ] Write unit tests for Gateway and Mapper
- [ ] Write integration test for module
- [ ] Document any custom behavior

---

*End of Implementation Plan*
