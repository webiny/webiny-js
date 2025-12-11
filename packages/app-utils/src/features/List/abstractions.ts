import { createAbstraction } from "@webiny/feature/admin";

// ============================================================================
// Base Types
// ============================================================================

export interface BaseListParams {
    search?: string;
    sort?: { by: string; dir: "asc" | "desc" };
    filters?: Record<string, unknown>;
    limit?: number;
}

// ============================================================================
// Query Params Repository
// ============================================================================

export interface IListQueryParamsRepository<TParams extends BaseListParams> {
    get(): TParams;
    set(updater: (params: TParams) => void): Promise<void>;
    replace(next: TParams): Promise<void>;
    reset(): void;
    subscribe(listener: (next: TParams) => void): () => void;
    dispose(): void;
}

export const ListQueryParamsRepository = createAbstraction<IListQueryParamsRepository<any>>(
    "ListQueryParamsRepository"
);

export namespace ListQueryParamsRepository {
    export type Interface<TParams extends BaseListParams = BaseListParams> =
        IListQueryParamsRepository<TParams>;
}

// ============================================================================
// Loading Repository
// ============================================================================

export interface ILoadingRepository {
    get(): Record<string, boolean>;
    set(action: string, isLoading?: boolean): Promise<void>;
    runCallback<T>(callback: Promise<T>, action: string): Promise<T>;
    isLoading(action: string): boolean;
    hasLoading(): boolean;
    isEmpty(): boolean;
}

export const LoadingRepository = createAbstraction<ILoadingRepository>("LoadingRepository");

export namespace LoadingRepository {
    export type Interface = ILoadingRepository;
}

// ============================================================================
// List Data Repository
// ============================================================================

export interface IListDataRepository<TItem, TParams extends BaseListParams> {
    load(params: TParams): Promise<void>;
    append(params: TParams): Promise<void>;
    getAll(): TItem[];
    hasMore(): boolean;
    clear(): void;
}

export const ListDataRepository =
    createAbstraction<IListDataRepository<any, any>>("ListDataRepository");

export namespace ListDataRepository {
    export type Interface<
        TItem = any,
        TParams extends BaseListParams = BaseListParams
    > = IListDataRepository<TItem, TParams>;
}

// ============================================================================
// Features
// ============================================================================

export interface ISearchFeature {
    setSearch(query: string): Promise<void>;
}

export const SearchFeature = createAbstraction<ISearchFeature>("SearchFeature");

export namespace SearchFeature {
    export type Interface = ISearchFeature;
}

export interface IFilterFeature {
    setFilter(key: string, value: unknown): Promise<void>;
    clearAllFilters(): Promise<void>;
}

export const FilterFeature = createAbstraction<IFilterFeature>("FilterFeature");

export namespace FilterFeature {
    export type Interface = IFilterFeature;
}

export interface ISortFeature {
    setSort(by: string, dir: "asc" | "desc"): Promise<void>;
}

export const SortFeature = createAbstraction<ISortFeature>("SortFeature");

export namespace SortFeature {
    export type Interface = ISortFeature;
}

export interface ILoadMoreFeature {
    execute(): Promise<void>;
}

export const LoadMoreFeature = createAbstraction<ILoadMoreFeature>("LoadMoreFeature");

export namespace LoadMoreFeature {
    export type Interface = ILoadMoreFeature;
}
