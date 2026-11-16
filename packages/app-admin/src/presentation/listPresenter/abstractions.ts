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
    initialSearch?: string;
    debounceMs?: number;
    limit?: number;
    itemLabel?: { singular: string; plural: string };
    /** Tell the admin assistant what this list shows. Needs `dispose()` when the view goes away. */
    assistant?: IListAssistantConfig<TRow>;
}

/**
 * What the list tells the assistant. The list itself adds the rows on screen, the selection and the
 * total; the view adds the sentence that names the screen and whatever ids only it knows.
 */
export interface IListAssistantConfig<TRow> {
    /** What the screen is, in one sentence: `Pages in Website Builder`. Read on every change. */
    view: () => string;
    /** The row's title, so a question can name it. */
    rowTitle: (row: TRow) => string;
    /** The row's id as the assistant's tools take it. Defaults to the row's `id`. */
    rowId?: (row: TRow) => string;
    /** Ids and titles only the view knows: a model, the folders, the open record. Never record contents. */
    details?: () => Record<string, unknown>;
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
    appliedQuery: IDataSourceQuery | null;
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
        label: string;
    };
    showingFilters: boolean;
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
        show(): void;
        hide(): void;
    };
    selection: {
        toggle(id: string): void;
        selectRangeTo(id: string): void;
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
    /** Stops telling the assistant about this list. */
    dispose(): void;
}

export const ListPresenter = createAbstraction<IListPresenter<any>>("ListPresenter");

export namespace ListPresenter {
    export type Interface<TRow = any> = IListPresenter<TRow>;
    export type ViewModel<TRow = any> = IListViewModel<TRow>;
    export type Actions = IListActions;
    export type Config<TRow = any> = IListPresenterConfig<TRow>;
    export type AssistantConfig<TRow = any> = IListAssistantConfig<TRow>;
    export type Error = IListError;
    export type DataSource<TRow = any> = IDataSource<TRow>;
    export type DataSourceQuery = IDataSourceQuery;
    export type DataSourceResult<TRow = any> = IDataSourceResult<TRow>;
}
