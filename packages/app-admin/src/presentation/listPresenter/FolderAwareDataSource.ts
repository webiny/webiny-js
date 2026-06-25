import { makeObservable, observable, computed, runInAction, action } from "mobx";
import type { IDataSource, IDataSourceQuery, IDataSourceMeta } from "./abstractions.js";
import { QueryMatcher } from "./QueryMatcher.js";

export interface FolderAwareDataSourceConfig<TRow> {
    locationField?: string;
    registeredFilterNames?: string[];
    getDescendantFolders?: { execute(folderId: string): { id: string }[] };
    keyField: keyof TRow & string;
    localFilters?: Record<string, (item: TRow, value: unknown) => boolean>;
}

export interface FetchParams {
    where?: Record<string, unknown>;
    sort?: string[];
    search?: string;
    limit?: number;
    after?: string;
}

export interface FetchResult<TRow> {
    data: TRow[];
    meta: { cursor: string | null; hasMoreItems: boolean; totalCount: number };
}

export abstract class FolderAwareDataSource<TRow> implements IDataSource<TRow> {
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;
    private _locationField: string;
    private _registeredFilterNames: Set<string>;
    private _getDescendantFolders: FolderAwareDataSourceConfig<TRow>["getDescendantFolders"];
    private _keyField: keyof TRow & string;
    protected queryMatcher: QueryMatcher<TRow>;

    constructor(config: FolderAwareDataSourceConfig<TRow>) {
        this._locationField = config.locationField ?? "location";
        this._registeredFilterNames = new Set(config.registeredFilterNames ?? []);
        this._getDescendantFolders = config.getDescendantFolders;
        this._keyField = config.keyField;

        const locationField = this._locationField;
        const localFilters: Record<string, (item: TRow, value: unknown) => boolean> = {
            folderId: (item, value) => {
                const folderId = value as string;
                const location = (item as Record<string, any>)[locationField];
                const itemFolderId = location?.folderId as string | undefined;
                if (folderId && folderId !== "root") {
                    return itemFolderId === folderId;
                }
                return !itemFolderId || itemFolderId === "root";
            },
            ...config.localFilters
        };

        this.queryMatcher = new QueryMatcher<TRow>({
            keyField: config.keyField,
            localFilters
        });

        makeObservable<FolderAwareDataSource<TRow>, "_meta" | "_loading">(this, {
            _meta: observable,
            _loading: observable,
            meta: computed,
            loading: computed,
            query: action,
            loadMore: action
        });
    }

    abstract get rows(): TRow[];

    abstract fetch(params: FetchParams): Promise<FetchResult<TRow>>;

    protected onQueryResult(_data: TRow[]): void {}

    protected onLoadMoreResult(_data: TRow[]): void {}

    get meta(): IDataSourceMeta {
        return this._meta;
    }

    get loading(): boolean {
        return this._loading;
    }

    async query(params: IDataSourceQuery): Promise<void> {
        this._loading = true;

        try {
            const result = await this.fetch({
                where: this.buildWhere(params),
                sort: this.buildSort(params),
                search: params.search,
                limit: params.limit,
                after: params.cursor
            });

            runInAction(() => {
                this.onQueryResult(result.data);
                this.queryMatcher.updateFromQuery(
                    params,
                    result.data.map(item => String(item[this._keyField]))
                );
                this._meta = {
                    cursor: result.meta.cursor,
                    hasMoreItems: result.meta.hasMoreItems,
                    totalCount: result.meta.totalCount
                };
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    async loadMore(params: IDataSourceQuery): Promise<void> {
        if (!this._meta.hasMoreItems || this._loading) {
            return;
        }

        this._loading = true;

        try {
            const result = await this.fetch({
                where: this.buildWhere(params),
                sort: this.buildSort(params),
                search: params.search,
                limit: params.limit,
                after: this._meta.cursor ?? undefined
            });

            runInAction(() => {
                this.onLoadMoreResult(result.data);
                this.queryMatcher.appendResultKeys(
                    result.data.map(item => String(item[this._keyField]))
                );
                this._meta = {
                    cursor: result.meta.cursor,
                    hasMoreItems: result.meta.hasMoreItems,
                    totalCount: result.meta.totalCount
                };
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    protected customizeWhere(
        _where: Record<string, unknown>,
        _filters: Record<string, unknown>
    ): void {}

    protected shouldExpandFolders(_filters: Record<string, unknown>): boolean {
        return false;
    }

    private buildWhere(params: IDataSourceQuery): Record<string, unknown> | undefined {
        const where: Record<string, unknown> = {};
        const filters = params.filters ?? {};
        const folderId = (filters.folderId as string | undefined) || "root";
        const isRoot = folderId === "root";
        const hasAdvancedFilters = Object.keys(filters).some(
            k => k !== "folderId" && !this._registeredFilterNames.has(k)
        );
        const isSearching =
            !!params.search || hasAdvancedFilters || this.shouldExpandFolders(filters);

        if (isSearching && isRoot) {
            // Search/filter from root: no folder filter — search all folders.
        } else if (isSearching && this._getDescendantFolders) {
            const descendants = this._getDescendantFolders.execute(folderId);
            const folderIds = descendants.map(f => f.id);
            where[this._locationField] = { folderId_in: folderIds };
        } else {
            where[this._locationField] = { folderId };
        }

        for (const [key, value] of Object.entries(filters)) {
            if (key === "folderId") {
                continue;
            }
            where[key] = value;
        }

        this.customizeWhere(where, filters);

        return Object.keys(where).length > 0 ? where : undefined;
    }

    private buildSort(params: IDataSourceQuery): string[] | undefined {
        if (!params.sort) {
            return undefined;
        }
        return [`${params.sort.field}_${params.sort.direction}`];
    }
}
