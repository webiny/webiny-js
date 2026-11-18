import { makeObservable } from "mobx";
import { observable } from "mobx";
import { observableRef } from "mobx";
import { computed } from "mobx";
import { action } from "mobx";
import { runInAction } from "mobx";
import type { IDataSource } from "./abstractions.js";
import type { IDataSourceQuery } from "./abstractions.js";
import type { IDataSourceMeta } from "./abstractions.js";
import { compareValues } from "./compareValues.js";

/**
 * A data source for a list small enough to load whole: it loads every row once and answers
 * search and sort from the loaded rows. Because search and sort go through the list presenter,
 * the rows the list hands to the view and to the assistant are the rows on screen.
 *
 * A query that differs from the last loaded one only in search or sort is answered without
 * loading. Any other query loads again, including the same query repeated, which is how a
 * refresh arrives. Filters are not applied to the loaded rows; a list that filters needs
 * `items` to do it.
 */
export abstract class LocalDataSource<TRow> implements IDataSource<TRow> {
    /** Search runs over the loaded rows, so it can follow every keystroke. */
    readonly searchDebounceMs = 0;

    private _query: IDataSourceQuery | null = null;
    /** The query whose rows `items` holds; null until a load succeeds. */
    private _loadedQuery: IDataSourceQuery | null = null;
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

        let rows = this.items;
        if (search) {
            rows = rows.filter(row => this.matches(row, search));
        }
        if (!sort) {
            return rows;
        }

        const direction = sort.direction === "ASC" ? 1 : -1;
        return [...rows].sort((a, b) => {
            const left = (a as Record<string, unknown>)[sort.field];
            const right = (b as Record<string, unknown>)[sort.field];
            return direction * compareValues(left, right);
        });
    }

    get meta(): IDataSourceMeta {
        return { cursor: null, hasMoreItems: false, totalCount: this.rows.length };
    }

    get loading(): boolean {
        return this._loading;
    }

    async query(params: IDataSourceQuery): Promise<void> {
        this._query = params;
        const loaded = this._loadedQuery;
        if (loaded && changesOnlySearchOrSort(loaded, params)) {
            this._loadedQuery = params;
            return;
        }

        this._loadedQuery = null;
        this._loading = true;
        try {
            await this.load();
            this._loadedQuery = params;
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    async loadMore(): Promise<void> {
        // Every row is loaded by `query`.
    }

    private matches(row: TRow, search: string): boolean {
        return this.searchIn(row).some(text => text?.toLowerCase().includes(search));
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
