import { makeAutoObservable, runInAction, computed, reaction, compareStructural } from "mobx";
import type { IReactionDisposer } from "mobx";
import {
    ListPresenter as Abstraction,
    type IListPresenter,
    type IListPresenterConfig,
    type IListAssistantConfig,
    type IListViewModel,
    type IListActions,
    type IListError,
    type IDataSource,
    type IDataSourceQuery
} from "./abstractions.js";
import { SelectionController } from "./SelectionController.js";
import { AssistantPageContext } from "~/features/assistantPageContext/abstractions.js";

/** Enough rows to resolve one named in a question, and to keep the details under the server's limit. */
const MAX_ASSISTANT_ROWS = 30;
const MAX_ASSISTANT_TITLE = 60;

class ListPresenterImpl<TRow> implements IListPresenter<TRow> {
    private _sort: { field: string; direction: "ASC" | "DESC" } | null = null;
    private _filters: Record<string, unknown> = {};
    private _initialFilterKeys: Set<string> = new Set();
    private _search = "";
    private _selection: SelectionController<TRow>;
    private _error: IListError | null = null;
    private _appliedQuery: IDataSourceQuery | null = null;
    private _dataSource: IDataSource<TRow> | null = null;
    private _debounceMs = 300;
    private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private _requeryScheduled = false;
    private _limit: number | undefined = undefined;
    private _initialized = false;
    private _loadingMore = false;
    private _showingFilters = false;
    private _itemLabel: { singular: string; plural: string } = {
        singular: "item",
        plural: "items"
    };
    private _disposeAssistant: IReactionDisposer | null = null;
    private _assistantOwner: AssistantPageContext.Owner | null = null;

    constructor(private pageContext: AssistantPageContext.Interface) {
        this._selection = new SelectionController<TRow>(
            () => this._dataSource?.rows ?? [],
            row => this.getRowId(row)
        );

        makeAutoObservable<
            ListPresenterImpl<TRow>,
            "_debounceTimer" | "_disposeAssistant" | "_assistantOwner" | "pageContext"
        >(this, {
            _debounceTimer: false,
            _disposeAssistant: false,
            _assistantOwner: false,
            pageContext: false,
            vm: computed
        });
    }

    get vm(): IListViewModel<TRow> {
        const ds = this._dataSource;
        const rows = ds ? ds.rows : [];
        const meta = ds ? ds.meta : { cursor: null, hasMoreItems: false, totalCount: 0 };
        const loading = ds ? ds.loading : false;
        const hasUserFilters =
            Object.keys(this._filters).some(k => !this._initialFilterKeys.has(k)) ||
            this._search.length > 0;

        return {
            rows,
            sort: this._sort,
            filters: this._filters,
            search: this._search,
            appliedQuery: this._appliedQuery,
            pagination: {
                hasMore: meta.hasMoreItems,
                loading: loading && !this._loadingMore,
                loadingMore: this._loadingMore,
                totalCount: meta.totalCount,
                currentCount: rows.length
            },
            selection: {
                selectedIds: this._selection.selectedIds,
                selectedCount: this._selection.selectedCount,
                allSelected: this._selection.allSelected,
                label: this.buildSelectionLabel()
            },
            showingFilters: this._showingFilters,
            empty: rows.length === 0 && !loading,
            emptyWithFilters: rows.length === 0 && !loading && hasUserFilters,
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
            },
            show: () => {
                this._showingFilters = true;
            },
            hide: () => {
                this._showingFilters = false;
            }
        },
        selection: {
            toggle: (id: string) => this._selection.toggle(id),
            selectRangeTo: (id: string) => this._selection.selectRangeTo(id),
            selectAll: () => this._selection.selectAll(),
            deselectAll: () => this._selection.deselectAll(),
            selectRows: (ids: string[]) => this._selection.selectRows(ids),
            isSelected: (id: string) => this._selection.isSelected(id)
        },
        loadMore: async () => {
            if (!this._dataSource) {
                return;
            }
            const meta = this._dataSource.meta;
            if (!meta.hasMoreItems || this._dataSource.loading) {
                return;
            }
            this._loadingMore = true;
            try {
                await this._dataSource.loadMore(this.buildQuery(meta.cursor));
                runInAction(() => {
                    this._error = null;
                });
            } catch (err) {
                runInAction(() => {
                    this._error = this.toListError(err);
                });
            } finally {
                runInAction(() => {
                    this._loadingMore = false;
                });
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
        this._initialFilterKeys = new Set(Object.keys(this._filters));
        this._debounceMs = config.debounceMs ?? 300;
        this._limit = config.limit;
        this._itemLabel = config.itemLabel ?? { singular: "item", plural: "items" };
        this._search = config.initialSearch ?? "";
        this._appliedQuery = null;
        this._selection.reset();
        this._initialized = true;
        this.executeQuery();
        this.describeToAssistant(config.assistant);
    }

    dispose(): void {
        if (this._disposeAssistant) {
            this._disposeAssistant();
            this._disposeAssistant = null;
        }
        if (this._assistantOwner) {
            this.pageContext.clear(this._assistantOwner);
            this._assistantOwner = null;
        }
    }

    /**
     * Keeps the assistant's page context in step with the list. The first describe sets it; later
     * ones replace it in place, so a drawer that set its own context over the list stays on top.
     */
    private describeToAssistant(config: IListAssistantConfig<TRow> | undefined): void {
        this.dispose();
        if (!config) {
            return;
        }

        this._disposeAssistant = reaction(
            () => this.assistantContext(config),
            context => {
                if (this._assistantOwner) {
                    this.pageContext.update(this._assistantOwner, context);
                } else {
                    this._assistantOwner = this.pageContext.set(context);
                }
            },
            { fireImmediately: true, equals: compareStructural }
        );
    }

    private assistantContext(config: IListAssistantConfig<TRow>): AssistantPageContext.Data {
        const rows = this._dataSource?.rows ?? [];
        const rowId = config.rowId ?? ((row: TRow) => this.getRowId(row));

        const visibleRows = rows.slice(0, MAX_ASSISTANT_ROWS).map(row => ({
            id: rowId(row),
            title: config.rowTitle(row).slice(0, MAX_ASSISTANT_TITLE)
        }));

        const selectedRows = rows
            .filter(row => this._selection.isSelected(this.getRowId(row)))
            .slice(0, MAX_ASSISTANT_ROWS)
            .map(rowId);

        const details: Record<string, unknown> = {
            items: this._itemLabel.plural,
            totalCount: this._dataSource?.meta.totalCount ?? rows.length,
            visibleRows
        };
        if (selectedRows.length > 0) {
            details["selectedRows"] = selectedRows;
        }
        if (this._search) {
            details["search"] = this._search;
        }

        return { view: config.view(), details: { ...details, ...config.details?.() } };
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
            runInAction(() => {
                this._appliedQuery = query;
            });
        } catch (err) {
            runInAction(() => {
                this._error = this.toListError(err);
            });
        }
    }

    private requery(): void {
        this.clearDebounce();
        this._selection.reset();

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
            this._selection.reset();
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

    private buildSelectionLabel(): string {
        const { selectedCount, allSelected } = this._selection;
        if (allSelected) {
            return `all ${this._itemLabel.plural}`;
        }
        if (selectedCount === 0) {
            return "";
        }
        const noun = selectedCount === 1 ? this._itemLabel.singular : this._itemLabel.plural;
        return `${selectedCount} ${noun}`;
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
    dependencies: [AssistantPageContext]
});
