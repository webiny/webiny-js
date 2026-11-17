import { makeObservable, observable, observableRef, computed, action, runInAction } from "mobx";
import orderBy from "lodash/orderBy.js";
import type { IDataSource, IDataSourceQuery, IDataSourceMeta } from "./abstractions.js";

/**
 * A data source for a list small enough to load whole: it loads every row once and answers
 * search and sort from the loaded rows. Because search and sort go through the list presenter,
 * the rows the list hands to the view and to the assistant are the rows on screen.
 *
 * A query that differs from the previous one only in search or sort is answered without loading.
 * Any other query loads again, including the same query repeated, which is how a refresh arrives.
 */
export abstract class LocalDataSource<TRow> implements IDataSource<TRow> {
    private _query: IDataSourceQuery | null = null;
    private _loading = false;

    protected constructor() {
        makeObservable<LocalDataSource<TRow>, "_query" | "_loading">(this, {
            _query: observableRef,
            _loading: observable,
            rows: computed,
            meta: computed,
            loading: computed,
            query: action
        });
    }

    /** Every loaded row, unfiltered. */
    protected abstract get items(): TRow[];

    /** Loads every row, so that `items` returns them. */
    protected abstract load(): Promise<void>;

    /** The texts a search matches against, case-insensitively. */
    protected abstract searchIn(row: TRow): Array<string | null | undefined>;

    get rows(): TRow[] {
        const search = this._query?.search?.toLowerCase();
        const sort = this._query?.sort;

        const matched = search
            ? this.items.filter(row =>
                  this.searchIn(row).some(text => text?.toLowerCase().includes(search))
              )
            : this.items;

        if (!sort) {
            return matched;
        }
        return orderBy(matched, [sort.field], [sort.direction === "ASC" ? "asc" : "desc"]);
    }

    get meta(): IDataSourceMeta {
        return { cursor: null, hasMoreItems: false, totalCount: this.rows.length };
    }

    get loading(): boolean {
        return this._loading;
    }

    async query(params: IDataSourceQuery): Promise<void> {
        const previous = this._query;
        this._query = params;
        if (previous && changesOnlySearchOrSort(previous, params)) {
            return;
        }

        this._loading = true;
        try {
            await this.load();
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    async loadMore(): Promise<void> {
        // Every row is loaded by `query`.
    }
}

function changesOnlySearchOrSort(previous: IDataSourceQuery, next: IDataSourceQuery): boolean {
    const { search: previousSearch, sort: previousSort, ...previousRest } = previous;
    const { search: nextSearch, sort: nextSort, ...nextRest } = next;

    const sameRest = JSON.stringify(previousRest) === JSON.stringify(nextRest);
    const sameSearchAndSort =
        previousSearch === nextSearch && JSON.stringify(previousSort) === JSON.stringify(nextSort);

    return sameRest && !sameSearchAndSort;
}
