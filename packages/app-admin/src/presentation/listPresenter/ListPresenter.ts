import { makeAutoObservable, computed } from "mobx";
import {
    ListPresenter as Abstraction,
    type IListPresenter,
    type IListPresenterConfig,
    type IListViewModel,
    type IListActions,
    type IListError,
    type IDataSource,
    type IDataSourceQuery
} from "./abstractions.js";

class ListPresenterImpl<TRow> implements IListPresenter<TRow> {
    private _sort: { field: string; direction: "ASC" | "DESC" } | null = null;
    private _filters: Record<string, unknown> = {};
    private _search = "";
    private _selectedIds: Set<string> = new Set();
    private _lastSelectedIndex = -1;
    private _error: IListError | null = null;
    private _appliedQuery: IDataSourceQuery | null = null;
    private _dataSource: IDataSource<TRow> | null = null;
    private _debounceMs = 300;
    private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private _requeryScheduled = false;
    private _limit: number | undefined = undefined;
    private _initialized = false;

    constructor() {
        makeAutoObservable<ListPresenterImpl<TRow>, "_debounceTimer">(this, {
            _debounceTimer: false,
            vm: computed
        });
    }

    get vm(): IListViewModel<TRow> {
        const ds = this._dataSource;
        const rows = ds ? ds.rows : [];
        const meta = ds ? ds.meta : { cursor: null, hasMoreItems: false, totalCount: 0 };
        const loading = ds ? ds.loading : false;
        const hasFilters = Object.keys(this._filters).length > 0 || this._search.length > 0;

        return {
            rows,
            sort: this._sort,
            filters: this._filters,
            search: this._search,
            appliedQuery: this._appliedQuery,
            pagination: {
                hasMore: meta.hasMoreItems,
                loading,
                loadingMore: false,
                totalCount: meta.totalCount,
                currentCount: rows.length
            },
            selection: {
                selectedIds: this._selectedIds,
                selectedCount: this._selectedIds.size,
                allSelected: rows.length > 0 && this._selectedIds.size === rows.length
            },
            empty: rows.length === 0 && !loading,
            emptyWithFilters: rows.length === 0 && !loading && hasFilters,
            error: this._error
        };
    }

    actions: IListActions = {
        search: {
            set: (query: string) => {
                if (this._search === query) {
                    return;
                }
                this._search = query;
                this.debouncedRequery();
            },
            clear: () => {
                if (this._search === "") {
                    return;
                }
                this._search = "";
                this.requery();
            }
        },
        sort: {
            set: (field: string, direction: "ASC" | "DESC") => {
                this._sort = { field, direction };
                this.requery();
            },
            toggle: (field: string) => {
                if (this._sort && this._sort.field === field) {
                    this._sort = {
                        field,
                        direction: this._sort.direction === "ASC" ? "DESC" : "ASC"
                    };
                } else {
                    this._sort = { field, direction: "ASC" };
                }
                this.requery();
            }
        },
        filter: {
            set: (key: string, value: unknown) => {
                this._filters = { ...this._filters, [key]: value };
                this.requery();
            },
            clear: (key: string) => {
                const { [key]: _, ...rest } = this._filters;
                this._filters = rest;
                this.requery();
            },
            clearAll: () => {
                this._filters = {};
                this.requery();
            }
        },
        selection: {
            toggle: (id: string, shiftKey?: boolean) => {
                const rows = this._dataSource?.rows ?? [];
                if (shiftKey && this._lastSelectedIndex >= 0) {
                    const currentIndex = rows.findIndex(row => this.getRowId(row) === id);
                    if (currentIndex >= 0) {
                        const start = Math.min(this._lastSelectedIndex, currentIndex);
                        const end = Math.max(this._lastSelectedIndex, currentIndex);
                        const newSelected = new Set(this._selectedIds);
                        for (let i = start; i <= end; i++) {
                            newSelected.add(this.getRowId(rows[i]));
                        }
                        this._selectedIds = newSelected;
                        this._lastSelectedIndex = currentIndex;
                        return;
                    }
                }

                const newSelected = new Set(this._selectedIds);
                if (newSelected.has(id)) {
                    newSelected.delete(id);
                } else {
                    newSelected.add(id);
                }
                this._selectedIds = newSelected;
                this._lastSelectedIndex = rows.findIndex(row => this.getRowId(row) === id);
            },
            selectAll: () => {
                const rows = this._dataSource?.rows ?? [];
                this._selectedIds = new Set(rows.map(row => this.getRowId(row)));
            },
            deselectAll: () => {
                this._selectedIds = new Set();
                this._lastSelectedIndex = -1;
            },
            selectRows: (ids: string[]) => {
                this._selectedIds = new Set(ids);
            },
            isSelected: (id: string) => {
                return this._selectedIds.has(id);
            }
        },
        loadMore: async () => {
            if (!this._dataSource) {
                return;
            }
            const meta = this._dataSource.meta;
            if (!meta.hasMoreItems || this._dataSource.loading) {
                return;
            }
            try {
                await this._dataSource.loadMore(this.buildQuery(meta.cursor));
                this._error = null;
            } catch (err) {
                this._error = this.toListError(err);
            }
        },
        refresh: async () => {
            await this.executeQuery();
        }
    };

    init(config: IListPresenterConfig<TRow>): void {
        this._dataSource = config.dataSource;
        this._sort = config.initialSort ?? null;
        this._filters = config.initialFilters ?? {};
        this._debounceMs = config.debounceMs ?? 300;
        this._limit = config.limit;
        this._initialized = true;
        this.executeQuery();
    }

    private buildQuery(cursor?: string | null): IDataSourceQuery {
        return {
            search: this._search || undefined,
            filters: Object.keys(this._filters).length > 0 ? this._filters : undefined,
            sort: this._sort ?? undefined,
            cursor: cursor ?? undefined,
            limit: this._limit
        };
    }

    private async executeQuery(): Promise<void> {
        if (!this._dataSource) {
            return;
        }
        this._error = null;
        const query = this.buildQuery();
        try {
            await this._dataSource.query(query);
            this._appliedQuery = query;
        } catch (err) {
            this._error = this.toListError(err);
        }
    }

    private requery(): void {
        this.clearDebounce();
        this._selectedIds = new Set();
        this._lastSelectedIndex = -1;

        if (!this._requeryScheduled) {
            this._requeryScheduled = true;
            queueMicrotask(() => {
                this._requeryScheduled = false;
                this.executeQuery();
            });
        }
    }

    private debouncedRequery(): void {
        this.clearDebounce();
        this._debounceTimer = setTimeout(() => {
            this._selectedIds = new Set();
            this._lastSelectedIndex = -1;
            this.executeQuery();
        }, this._debounceMs);
    }

    private clearDebounce(): void {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }
    }

    private getRowId(row: TRow): string {
        return (row as any).id;
    }

    private toListError(err: unknown): IListError {
        if (err instanceof Error) {
            return { code: "UNKNOWN", message: err.message, retryable: true };
        }
        return { code: "UNKNOWN", message: String(err), retryable: true };
    }
}

export const ListPresenter = Abstraction.createImplementation({
    implementation: ListPresenterImpl,
    dependencies: []
});
