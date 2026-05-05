import { createAbstraction } from "@webiny/feature/admin";

// ---------------------------------------------------------------------------
// DataSource interfaces
// ---------------------------------------------------------------------------

export interface IDataSourceQuery {
    search?: string;
    filters?: Record<string, unknown>;
    sort?: { field: string; direction: "ASC" | "DESC" };
    cursor?: string;
    limit?: number;
}

export interface IDataSourceMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface IDataSourceResult<TRow> {
    rows: TRow[];
    meta: IDataSourceMeta;
}

export interface IDataSource<TRow> {
    readonly rows: TRow[];
    readonly meta: IDataSourceMeta;
    readonly loading: boolean;
    query(params: IDataSourceQuery): Promise<void>;
    loadMore(params: IDataSourceQuery): Promise<void>;
}

// ---------------------------------------------------------------------------
// ListPresenter config
// ---------------------------------------------------------------------------

export interface IListPresenterConfig<TRow> {
    dataSource: IDataSource<TRow>;
    initialSort?: { field: string; direction: "ASC" | "DESC" };
    initialFilters?: Record<string, unknown>;
    debounceMs?: number;
    limit?: number;
}

// ---------------------------------------------------------------------------
// ListError
// ---------------------------------------------------------------------------

export interface IListError {
    code: string;
    message: string;
    retryable: boolean;
}

// ---------------------------------------------------------------------------
// ListViewModel
// ---------------------------------------------------------------------------

export interface IListViewModel<TRow> {
    rows: TRow[];
    sort: { field: string; direction: "ASC" | "DESC" } | null;
    filters: Record<string, unknown>;
    search: string;
    pagination: {
        hasMore: boolean;
        loading: boolean;
        loadingMore: boolean;
        totalCount: number;
        currentCount: number;
    };
    selection: {
        selectedIds: Set<string>;
        selectedCount: number;
        allSelected: boolean;
    };
    empty: boolean;
    emptyWithFilters: boolean;
    error: IListError | null;
}

// ---------------------------------------------------------------------------
// ListActions
// ---------------------------------------------------------------------------

export interface IListActions {
    search: {
        set(query: string): void;
        clear(): void;
    };
    sort: {
        set(field: string, direction: "ASC" | "DESC"): void;
        toggle(field: string): void;
    };
    filter: {
        set(key: string, value: unknown): void;
        clear(key: string): void;
        clearAll(): void;
    };
    selection: {
        toggle(id: string, shiftKey?: boolean): void;
        selectAll(): void;
        deselectAll(): void;
        selectRows(ids: string[]): void;
        isSelected(id: string): boolean;
    };
    loadMore(): Promise<void>;
    refresh(): Promise<void>;
}

// ---------------------------------------------------------------------------
// ListPresenter abstraction
// ---------------------------------------------------------------------------

export interface IListPresenter<TRow> {
    vm: IListViewModel<TRow>;
    actions: IListActions;
    init(config: IListPresenterConfig<TRow>): void;
}

export const ListPresenter = createAbstraction<IListPresenter<any>>("ListPresenter");

export namespace ListPresenter {
    export type Interface<TRow = any> = IListPresenter<TRow>;
    export type ViewModel<TRow = any> = IListViewModel<TRow>;
    export type Actions = IListActions;
    export type Config<TRow = any> = IListPresenterConfig<TRow>;
    export type Error = IListError;
    export type DataSource<TRow = any> = IDataSource<TRow>;
    export type DataSourceQuery = IDataSourceQuery;
    export type DataSourceResult<TRow = any> = IDataSourceResult<TRow>;
}
