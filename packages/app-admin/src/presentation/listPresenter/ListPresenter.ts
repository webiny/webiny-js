import { makeAutoObservable, runInAction, computed } from "mobx";
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
    // Internal state.
    private _rows: TRow[] = [];
    private _sort: { field: string; direction: "ASC" | "DESC" } | null = null;
    private _filters: Record<string, unknown> = {};
    private _search = "";
    private _cursor: string | null = null;
    private _hasMoreItems = false;
    private _totalCount = 0;
    private _loading = false;
    private _loadingMore = false;
    private _selectedIds: Set<string> = new Set();
    private _lastSelectedIndex = -1;
    private _error: IListError | null = null;
    private _dataSource: IDataSource<TRow> | null = null;
    private _debounceMs = 300;
    private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private _initialized = false;

    constructor() {
        makeAutoObservable<ListPresenterImpl<TRow>, "_dataSource" | "_debounceTimer">(this, {
            _dataSource: false,
            _debounceTimer: false,
            vm: computed
        });
    }

    // ---------------------------------------------------------------------------
    // ViewModel (MobX computed)
    // ---------------------------------------------------------------------------

    get vm(): IListViewModel<TRow> {
        const hasFilters =
            Object.keys(this._filters).length > 0 || this._search.length > 0;

        return {
            rows: this._rows,
            sort: this._sort,
            filters: this._filters,
            search: this._search,
            pagination: {
                hasMore: this._hasMoreItems,
                loading: this._loading,
                loadingMore: this._loadingMore,
                totalCount: this._totalCount,
                currentCount: this._rows.length
            },
            selection: {
                selectedIds: this._selectedIds,
                selectedCount: this._selectedIds.size,
                allSelected:
                    this._rows.length > 0 && this._selectedIds.size === this._rows.length
            },
            empty: this._rows.length === 0 && !this._loading,
            emptyWithFilters:
                this._rows.length === 0 && !this._loading && hasFilters,
            error: this._error
        };
    }

    // ---------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------

    actions: IListActions = {
        search: {
            set: (query: string) => {
                this._search = query;
                this.debouncedRequery();
            },
            clear: () => {
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
                if (shiftKey && this._lastSelectedIndex >= 0) {
                    const currentIndex = this._rows.findIndex(
                        row => this.getRowId(row) === id
                    );
                    if (currentIndex >= 0) {
                        const start = Math.min(this._lastSelectedIndex, currentIndex);
                        const end = Math.max(this._lastSelectedIndex, currentIndex);
                        const newSelected = new Set(this._selectedIds);
                        for (let i = start; i <= end; i++) {
                            newSelected.add(this.getRowId(this._rows[i]));
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
                this._lastSelectedIndex = this._rows.findIndex(
                    row => this.getRowId(row) === id
                );
            },
            selectAll: () => {
                this._selectedIds = new Set(
                    this._rows.map(row => this.getRowId(row))
                );
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
            if (!this._dataSource || !this._hasMoreItems || this._loadingMore) {
                return;
            }
            this._loadingMore = true;
            try {
                const result = await this._dataSource.query(this.buildQuery(this._cursor));
                runInAction(() => {
                    this._rows = [...this._rows, ...result.rows];
                    this._cursor = result.meta.cursor;
                    this._hasMoreItems = result.meta.hasMoreItems;
                    this._totalCount = result.meta.totalCount;
                    this._loadingMore = false;
                    this._error = null;
                });
            } catch (err) {
                runInAction(() => {
                    this._loadingMore = false;
                    this._error = this.toListError(err);
                });
            }
        },
        refresh: async () => {
            await this.executeQuery();
        }
    };

    // ---------------------------------------------------------------------------
    // Init
    // ---------------------------------------------------------------------------

    init(config: IListPresenterConfig<TRow>): void {
        this._dataSource = config.dataSource;
        this._sort = config.initialSort ?? null;
        this._filters = config.initialFilters ?? {};
        this._debounceMs = config.debounceMs ?? 300;
        this._initialized = true;
        this.executeQuery();
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    private buildQuery(cursor?: string | null): IDataSourceQuery {
        return {
            search: this._search || undefined,
            filters: Object.keys(this._filters).length > 0 ? this._filters : undefined,
            sort: this._sort ?? undefined,
            cursor: cursor ?? undefined
        };
    }

    private async executeQuery(): Promise<void> {
        if (!this._dataSource) {
            return;
        }
        this._loading = true;
        this._error = null;
        try {
            const result = await this._dataSource.query(this.buildQuery());
            runInAction(() => {
                this._rows = result.rows;
                this._cursor = result.meta.cursor;
                this._hasMoreItems = result.meta.hasMoreItems;
                this._totalCount = result.meta.totalCount;
                this._loading = false;
            });
        } catch (err) {
            runInAction(() => {
                this._rows = [];
                this._loading = false;
                this._error = this.toListError(err);
            });
        }
    }

    private requery(): void {
        this.clearDebounce();
        this._cursor = null;
        this._selectedIds = new Set();
        this._lastSelectedIndex = -1;
        this.executeQuery();
    }

    private debouncedRequery(): void {
        this.clearDebounce();
        this._debounceTimer = setTimeout(() => {
            this._cursor = null;
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
        // Support rows with an `id` property.
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
