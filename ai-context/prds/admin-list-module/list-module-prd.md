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

| Goal              | Description                                  |
| ----------------- | -------------------------------------------- |
| **Simplicity**    | Developers implement only Gateway + Mapper   |
| **Type Safety**   | Full TypeScript inference from entity types  |
| **Consistency**   | All lists behave identically                 |
| **Extensibility** | Custom presenters for special cases          |
| **Testability**   | Each layer independently testable            |
| **Zero Lock-in**  | Can eject to manual implementation if needed |

### Non-Goals

| Non-Goal              | Reason                          |
| --------------------- | ------------------------------- |
| UI Components         | Framework provides data, not UI |
| Server-side rendering | Client-side MobX focus          |
| Offline support       | Out of scope for v1             |
| Real-time updates     | Can be added as extension later |

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
  export interface Interface<TDto, TEntity> extends ListMapper<TDto, TEntity> {}
}
```

### 4.4 Module Configuration

> **Pattern note:** Columns, filters, bulk actions, and entry actions are **not** declared here as data. They are registered declaratively via JSX using the react-properties pattern — see §9.4 and the canonical reference in `packages/app-headless-cms/src/admin/views/contentEntries/ContentEntriesModule.tsx`. Only runtime behaviour knobs belong in this config.

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

  /** Runtime behaviour configuration (UI shape is declared via JSX — see §9.4) */
  config: {
    /** Initial query parameters */
    initialParams: Partial<TParams>;

    /** Search behaviour */
    search?: {
      debounceMs?: number;
      minLength?: number;
    };

    /** Pagination settings */
    pagination?: {
      defaultLimit?: number;
      maxLimit?: number;
    };
  };
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
  toggle(by: string): void; // Cycles: none → asc → desc → none
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
  selectPage(): void; // Select all items on current page
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
}
```

### 5.3 LoadingRepository

```typescript
// core/list-module/repositories/LoadingRepository.ts

import { makeAutoObservable, runInAction } from "mobx";

export type LoadingAction = "initial" | "reload" | "loadMore" | "refresh" | "bulkAction";

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

  async runCallback<T>(promise: Promise<T>, action: LoadingAction | string): Promise<T> {
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
}
```

---

## 6. Factory Implementation

> **DI pattern:** The factory uses the Webiny DI system — `createAbstraction`, `createImplementation`, and `createFeature` from `webiny/admin`. There is no custom `Container` class, no manual `Symbol` tokens, and no `registerSingleton` calls. All wiring goes through `createFeature({ register, resolve })`. The `resolve` function is what makes a feature consumable via `useFeature()` in React.

### 6.1 createListModule Function

`createListModule` returns a **feature bundle** — a plain object with a pre-built `createFeature` and a `useList` React hook. The consumer registers the feature once via `<RegisterFeature>` and calls `useList()` anywhere in that subtree.

```typescript
// core/list-module/createListModule.ts

import { createAbstraction, createFeature, createImplementation, useFeature } from "webiny/admin";
import { ListQueryParamsRepository } from "./repositories/ListQueryParamsRepository.js";
import { ListDataRepository } from "./repositories/ListDataRepository.js";
import { LoadingRepository } from "./repositories/LoadingRepository.js";
import { SelectionRepository } from "./repositories/SelectionRepository.js";
import { GenericListPresenter } from "./presenter/GenericListPresenter.js";
import type { ListModuleConfig, BaseListParams } from "./contracts/index.js";

export function createListModule<
  TEntity extends { id: string },
  TDto,
  TParams extends BaseListParams
>(moduleConfig: ListModuleConfig<TEntity, TDto, TParams>) {
  const {
    name,
    gateway: GatewayImpl,
    mapper: MapperImpl,
    presenter: PresenterImpl,
    config
  } = moduleConfig;

  // ── 1. Per-module abstractions (typed DI tokens) ──────────────────────────
  // Each createListModule call creates a fresh set of abstractions so multiple
  // modules (Pages, Redirects, Users…) do not share the same DI slots.

  const GatewayAbstraction = createAbstraction<ListGateway.Interface<TDto, TParams>>(
    `${name}/Gateway`
  );
  const MapperAbstraction = createAbstraction<ListMapper.Interface<TDto, TEntity>>(
    `${name}/Mapper`
  );
  const QueryParamsAbstraction = createAbstraction<ListQueryParamsRepository.Interface<TParams>>(
    `${name}/QueryParams`
  );
  const DataRepositoryAbstraction = createAbstraction<ListDataRepository.Interface<TEntity>>(
    `${name}/DataRepository`
  );
  const LoadingAbstraction = createAbstraction<LoadingRepository.Interface>(`${name}/Loading`);
  const SelectionAbstraction = createAbstraction<SelectionRepository.Interface>(
    `${name}/Selection`
  );
  const PresenterAbstraction = createAbstraction<GenericListPresenter.Interface<TEntity, TParams>>(
    `${name}/Presenter`
  );

  // ── 2. Implementations ────────────────────────────────────────────────────

  const Gateway = GatewayAbstraction.createImplementation({
    implementation: GatewayImpl,
    dependencies: [] // caller-provided; GatewayImpl injects its own deps (e.g., GraphQLClient)
  });

  const Mapper = MapperAbstraction.createImplementation({
    implementation: MapperImpl,
    dependencies: []
  });

  const QueryParams = QueryParamsAbstraction.createImplementation({
    implementation: class extends ListQueryParamsRepository<TParams> {
      constructor() {
        super(config.initialParams as TParams);
      }
    },
    dependencies: []
  });

  const DataRepository = DataRepositoryAbstraction.createImplementation({
    implementation: ListDataRepository,
    dependencies: [GatewayAbstraction, MapperAbstraction]
  });

  const Loading = LoadingAbstraction.createImplementation({
    implementation: LoadingRepository,
    dependencies: []
  });

  const Selection = SelectionAbstraction.createImplementation({
    implementation: SelectionRepository,
    dependencies: []
  });

  const PresenterClass = PresenterImpl ?? GenericListPresenter;
  const Presenter = PresenterAbstraction.createImplementation({
    implementation: PresenterClass,
    dependencies: [
      DataRepositoryAbstraction,
      QueryParamsAbstraction,
      LoadingAbstraction,
      SelectionAbstraction
    ]
  });

  // ── 3. Feature (the unit of DI registration) ─────────────────────────────
  // Register everything in singleton scope — the presenter and repositories
  // must be long-lived to hold reactive state across renders.

  const Feature = createFeature({
    name,
    register(container) {
      container.register(Gateway);
      container.register(Mapper);
      container.register(QueryParams).inSingletonScope();
      container.register(DataRepository).inSingletonScope();
      container.register(Loading).inSingletonScope();
      container.register(Selection).inSingletonScope();
      container.register(Presenter).inSingletonScope();
    },
    resolve(container) {
      return {
        presenter: container.resolve(PresenterAbstraction),
        queryParams: container.resolve(QueryParamsAbstraction),
        loading: container.resolve(LoadingAbstraction),
        selection: container.resolve(SelectionAbstraction)
      };
    }
  });

  // ── 4. React hook ─────────────────────────────────────────────────────────

  function useList(): UseListResult<TEntity, TParams> {
    const { presenter, queryParams, loading, selection } = useFeature(Feature);
    return buildUseListResult(presenter, queryParams, loading, selection);
  }

  // ── 5. Public API ─────────────────────────────────────────────────────────

  return { name, Feature, useList };
}
```

### 6.2 buildUseListResult (actions builder)

Extracted so it can be unit-tested independently of React.

```typescript
// core/list-module/hooks/buildUseListResult.ts

export function buildUseListResult<TEntity extends { id: string }, TParams extends BaseListParams>(
  presenter: GenericListPresenter.Interface<TEntity, TParams>,
  queryParams: ListQueryParamsRepository.Interface<TParams>,
  loading: LoadingRepository.Interface,
  selection: SelectionRepository.Interface
): UseListResult<TEntity, TParams> {
  const actions: ListActions<TParams> = {
    search: {
      set: query => queryParams.set("search" as keyof TParams, query as TParams[keyof TParams]),
      clear: () => queryParams.set("search" as keyof TParams, undefined as TParams[keyof TParams])
    },
    filter: {
      set: (key, value) => queryParams.set(key, value),
      clear: key => queryParams.set(key, undefined as TParams[typeof key]),
      clearAll: () => queryParams.reset(),
      replace: filters => queryParams.merge(filters)
    },
    sort: {
      set: (by, direction) =>
        queryParams.set("sort" as keyof TParams, { by, direction } as TParams[keyof TParams]),
      toggle: by => {
        const current = queryParams.getSort();
        if (current?.by !== by) {
          queryParams.set(
            "sort" as keyof TParams,
            { by, direction: "asc" } as TParams[keyof TParams]
          );
        } else if (current.direction === "asc") {
          queryParams.set(
            "sort" as keyof TParams,
            { by, direction: "desc" } as TParams[keyof TParams]
          );
        } else {
          queryParams.set("sort" as keyof TParams, null as TParams[keyof TParams]);
        }
      },
      clear: () => queryParams.set("sort" as keyof TParams, null as TParams[keyof TParams])
    },
    selection: {
      toggle: id => selection.toggle(id),
      select: id => selection.select(id),
      deselect: id => selection.deselect(id),
      selectMultiple: ids => selection.selectMultiple(ids),
      deselectMultiple: ids => selection.deselectMultiple(ids),
      selectAll: () => selection.selectMultiple(presenter.vm.items.map(i => i.id)),
      deselectAll: () => selection.deselectAll(),
      selectPage: () => selection.selectMultiple(presenter.vm.items.map(i => i.id))
    },
    bulk: {
      execute: action => presenter.executeBulkAction(action),
      canExecute: action => presenter.canExecuteBulkAction(action),
      isExecuting: action => loading.isLoading(`bulk:${action}`)
    },
    loadMore: () => presenter.loadMore(),
    refresh: () => presenter.refresh(),
    reset: () => presenter.reset()
  };

  return { vm: presenter.vm, actions };
}
```

### 6.2 Generic List Presenter

```typescript
// core/list-module/presenter/GenericListPresenter.ts

import { makeAutoObservable, computed, toJS, reaction } from "mobx";

export class GenericListPresenter<TEntity extends { id: string }, TParams extends BaseListParams> {
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
    const unsubscribe = this.queryParams.subscribe(async params => {
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

    await this.loading.runCallback(this.repository.load(this.queryParams.get()), "initial");

    this.initialLoadDone = true;
  }

  dispose(): void {
    this.disposers.forEach(dispose => dispose());
    this.disposers = [];
  }

  // === Actions ===

  async reload(params?: TParams): Promise<void> {
    const paramsToUse = params ?? this.queryParams.get();

    await this.loading.runCallback(this.repository.load(paramsToUse), "reload");
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

    await this.loading.runCallback(this.repository.append(paramsWithCursor), "loadMore");
  }

  async refresh(): Promise<void> {
    // Reset cursor and reload
    this.queryParams.set("cursor", null as TParams["cursor"]);

    await this.loading.runCallback(this.repository.load(this.queryParams.get()), "refresh");
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
}
```

---

## 7. React Integration

### 7.1 Feature Registration

The consumer mounts `<RegisterFeature>` once at the appropriate tree level — typically inside the module's `Extension.tsx` or a route component. After that, any descendent can call `module.useList()`.

```tsx
// admin/Extension.tsx
import { RegisterFeature } from "webiny/admin";
import { PagesListModule } from "./modules/pages/index.js";
import { PagesModule } from "./modules/pages/PagesModule.js";

export const Extension = () => (
  <>
    {/* Register all DI bindings for the Pages list */}
    <RegisterFeature feature={PagesListModule.Feature} />

    {/* Register declarative UI config (columns, filters, actions) */}
    <PagesModule />
  </>
);
```

### 7.2 useList Hook (inside WithConfig boundary)

`module.useList()` calls `useFeature(Feature)` internally, which resolves the presenter and repositories from the DI container. Wrap the consuming component in `observer` so MobX reactivity works.

```tsx
// modules/pages/PagesListTable.tsx
import { observer } from "mobx-react-lite";
import { PagesListModule } from "./index.js";

export const PagesListTable = observer(function PagesListTable() {
  const { vm, actions } = PagesListModule.useList();
  const { browser } = PagesListModule.useConfig();

  // vm is a plain MobX-observable object — observer() re-renders on change
  return (
    <DataTable
      columns={browser.table.columns}
      items={vm.items}
      isLoading={vm.isInitialLoading}
      sort={vm.sort}
      onSort={actions.sort.toggle}
      selection={vm.selection}
      onToggleSelect={actions.selection.toggle}
    />
  );
});
```

### 7.3 Presenter Lifecycle

The presenter's `initialize()` / `dispose()` are called inside the presenter itself via MobX reactions, not from React. The DI container is singleton-scoped, so the presenter is created once and lives for the lifetime of its parent component tree. No `useEffect` needed in the hook.

```typescript
// GenericListPresenter — lifecycle is self-managed
class GenericListPresenterImpl {
  constructor(...deps) {
    makeAutoObservable(this);
    // Auto-initialize on first vm access, or call initialize() explicitly
  }

  async initialize() {
    if (this.initialLoadDone) return;
    await this.loading.runCallback(this.repository.load(this.queryParams.get()), "initial");
    this.initialLoadDone = true;
  }

  dispose() {
    this.disposers.forEach(d => d());
  }
}
```

Optionally, the consuming component can call `initialize()` once on mount via `useEffect` if eager loading is desired:

```tsx
useEffect(() => {
  presenter.initialize();
  return () => presenter.dispose();
}, [presenter]);
```

### 7.4 UseListResult Interface

```typescript
export interface UseListResult<TEntity extends { id: string }, TParams extends BaseListParams> {
  vm: ListViewModel<TEntity>;
  actions: ListActions<TParams>;
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
  constructor(@inject(ApiClient) private api: ApiClient) {}

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

The module definition is split into two parts, mirroring the pattern in `ContentEntriesModule.tsx` + `ContentEntries.tsx`.

**Part A — Core module** (gateway, mapper, runtime config knobs):

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
    search: {
      debounceMs: 300,
      minLength: 2
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

**Part B — Declarative UI config** (columns, filters, actions — analogous to `ContentEntriesModule.tsx`):

```tsx
// modules/pages/PagesModule.tsx

import React from "react";
import { PagesListModule } from "./index";
import { FilterByStatus } from "./components/FilterByStatus";
import { ActionDelete, ActionPublish } from "./components/BulkActions";
import { CellTitle, CellStatus, CellModified, CellAuthor, CellActions } from "./components/Cells";
import { EditPage, DeletePage } from "./components/EntryActions";

const { Browser } = PagesListModule.Config;

export const PagesModule = () => (
  <PagesListModule.Config>
    <Browser.Filter name={"status"} element={<FilterByStatus />} />
    <Browser.BulkAction name={"publish"} element={<ActionPublish />} />
    <Browser.BulkAction name={"delete"} element={<ActionDelete />} />
    <Browser.Table.Column
      name={"title"}
      header={"Title"}
      cell={<CellTitle />}
      sortable={true}
      hideable={false}
      size={200}
    />
    <Browser.Table.Column
      name={"status"}
      header={"Status"}
      cell={<CellStatus />}
      truncate={false}
    />
    <Browser.Table.Column
      name={"updatedAt"}
      header={"Modified"}
      cell={<CellModified />}
      sortable={true}
    />
    <Browser.Table.Column name={"createdBy"} header={"Author"} cell={<CellAuthor />} />
    <Browser.Table.Column
      name={"actions"}
      header={""}
      cell={<CellActions />}
      size={56}
      resizable={false}
      hideable={false}
      truncate={false}
    />
    <Browser.Entry.Action name={"edit"} element={<EditPage />} />
    <Browser.Entry.Action name={"delete"} element={<DeletePage />} after={"$last"} />
  </PagesListModule.Config>
);
```

**Part C — Entry point** (wires both together — analogous to `ContentEntries.tsx`):

```tsx
// modules/pages/PagesListView.tsx

import React from "react";
import { PagesListModule } from "./index";
import { PagesListTable } from "./PagesListTable";

export const PagesListView = () => (
  <PagesListModule.WithConfig>
    <PagesListTable />
  </PagesListModule.WithConfig>
);
```

### 9.5 React Table Component

`PagesListTable` is the inner component rendered inside `PagesListModule.WithConfig`. It reads both the runtime view model and the declarative UI config (columns, filters, bulk actions) from their respective hooks — mirroring how `useContentEntryListConfig()` is consumed in the CMS.

```tsx
// modules/pages/PagesListTable.tsx

import { observer } from "mobx-react-lite";
import { PagesListModule } from "./index";

export const PagesListTable = observer(function PagesListTable() {
  const { vm, actions } = PagesListModule.useList();
  const { browser } = PagesListModule.useConfig();
  // browser = { filters, bulkActions, table: { columns }, entry: { actions: entryActions } }

  return (
    <div className="pages-list">
      {/* Search */}
      <input
        type="search"
        value={vm.search}
        onChange={e => actions.search.set(e.target.value)}
        placeholder="Search pages..."
      />

      {/* Filters — rendered from declarative config, not hardcoded */}
      <BaseFilters
        filters={browser.filters}
        onFilter={actions.filter.set}
        onClearAll={actions.filter.clearAll}
        hasActiveFilters={vm.hasActiveFilters}
      />

      {/* Bulk Actions — rendered from declarative config */}
      {vm.selection.count > 0 && (
        <BulkActions
          actions={browser.bulkActions}
          selection={vm.selection}
          onDeselectAll={actions.selection.deselectAll}
        />
      )}

      {/* Error / Loading / Empty states */}
      {vm.error && <ErrorMessage error={vm.error} onRetry={actions.refresh} />}
      {vm.isInitialLoading && <Spinner />}
      {vm.isEmpty && !vm.isInitialLoading && (
        <EmptyState
          hasActiveFilters={vm.isEmptyWithFilters}
          onClearFilters={actions.filter.clearAll}
        />
      )}

      {/* Table — columns from declarative config */}
      {!vm.isEmpty && !vm.isInitialLoading && (
        <DataTable
          columns={browser.table.columns}
          items={vm.items}
          sort={vm.sort}
          selection={vm.selection}
          onSort={actions.sort.toggle}
          onToggleSelect={actions.selection.toggle}
          onToggleSelectAll={() =>
            vm.selection.isAllSelected
              ? actions.selection.deselectAll()
              : actions.selection.selectPage()
          }
        />
      )}

      {/* Load More */}
      {vm.hasMore && (
        <button onClick={actions.loadMore} disabled={vm.isLoadingMore}>
          {vm.isLoadingMore ? "Loading..." : "Load More"}
        </button>
      )}

      {vm.total != null && (
        <footer>
          Showing {vm.items.length} of {vm.total} pages
        </footer>
      )}
    </div>
  );
});
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

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ search: "test" }));
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
      debounceMs: 0 // Disable debounce for tests
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

    expect(mockGateway.fetchList).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 }));
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

| Component    | Min Coverage |
| ------------ | ------------ |
| Repositories | 95%          |
| Features     | 90%          |
| Presenter    | 90%          |
| Factory      | 85%          |
| React Hook   | 80%          |
| Integration  | 75%          |

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
  config: {
    /* ... */
  }
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

| Old API                      | New API                      |
| ---------------------------- | ---------------------------- |
| `presenter.vm.items`         | `vm.items`                   |
| `presenter.vm.isLoading`     | `vm.isLoading`               |
| `searchFeature.setSearch()`  | `actions.search.set()`       |
| `filterFeature.setFilter()`  | `actions.filter.set()`       |
| `sortFeature.setSort()`      | `actions.sort.set()`         |
| `loadMoreFeature.loadMore()` | `actions.loadMore()`         |
| `selectionFeature.toggle()`  | `actions.selection.toggle()` |

---

## Appendix: Glossary

| Term                | Definition                                      |
| ------------------- | ----------------------------------------------- |
| **Module**          | A complete, self-contained list feature package |
| **Gateway**         | Infrastructure layer that makes API calls       |
| **Mapper**          | Transforms DTOs to domain entities              |
| **Repository**      | Manages observable state                        |
| **Feature**         | Headless service that performs one action       |
| **Presenter**       | Orchestrates data flow and generates VM         |
| **VM (View Model)** | Read-only snapshot of UI state                  |
| **Actions**         | Methods the UI can call to trigger changes      |

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

_End of Implementation Plan_
