import { makeObservable, observable, computed, runInAction, action } from "mobx";
import type { IDataSource, IDataSourceQuery, IDataSourceMeta } from "./abstractions.js";
import type { FetchResult } from "./FolderAwareDataSource.js";

export abstract class SimpleDataSource<TRow> implements IDataSource<TRow> {
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;

    protected constructor() {
        makeObservable<SimpleDataSource<TRow>, "_meta" | "_loading">(this, {
            _meta: observable,
            _loading: observable,
            meta: computed,
            loading: computed,
            query: action,
            loadMore: action
        });
    }

    abstract get rows(): TRow[];

    abstract fetch(params: IDataSourceQuery): Promise<FetchResult<TRow>>;

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
            const result = await this.fetch(params);

            runInAction(() => {
                this.onQueryResult(result.data);
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
                ...params,
                cursor: this._meta.cursor ?? undefined
            });

            runInAction(() => {
                this.onLoadMoreResult(result.data);
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
}
