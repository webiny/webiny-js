import { makeObservable, observable, computed, action } from "mobx";
import type { IDataSourceQuery } from "./abstractions.js";

type ItemPredicate<TRow> = (item: TRow, value: unknown) => boolean;

type SortValueGetter<TRow> = (item: TRow, field: string) => unknown;

export interface QueryMatcherConfig<TRow> {
    keyField: keyof TRow & string;
    localFilters: Record<string, ItemPredicate<TRow>>;
    /**
     * Reads the value of a sort field from an item. Defaults to a dot-path lookup
     * (e.g. `savedOn`, `values.title`). Override when the query's sort field name
     * does not match the item's shape.
     */
    getSortValue?: SortValueGetter<TRow>;
}

/**
 * Decides which cached items belong in the current view.
 *
 * A DataSource backed by a shared cache (e.g., per-model entry cache) needs to
 * filter cached items to only those matching the active query. QueryMatcher does
 * this by splitting filters into two categories:
 *
 * - **Local filters** (e.g., folderId, status) — evaluated client-side against
 *   each item using predicates provided via `localFilters` config. Used when
 *   browsing without search or server-side filters.
 *
 * - **Server-side filters** (search, advanced search, any filter key not in
 *   `localFilters`) — cannot be evaluated locally. Instead, QueryMatcher tracks
 *   the set of item keys returned by the last server query (`_queryResultKeys`)
 *   and restricts the view to those items.
 *
 * The `matcher` getter is MobX-computed, so any DataSource `rows` getter that
 * reads it will recompute when the matcher changes after a query.
 *
 * Usage:
 * ```ts
 * const matcher = new QueryMatcher<MyItem>({
 *     keyField: "id",
 *     localFilters: {
 *         folderId: (item, value) => item.folderId === value,
 *         status: (item, value) => item.status === value,
 *     }
 * });
 *
 * // In DataSource.query(), after fetching:
 * matcher.updateFromQuery(params, result.data.map(item => item.id));
 *
 * // In DataSource.rows getter:
 * return cache.getItems().filter(matcher.matcher);
 * ```
 */
export class QueryMatcher<TRow> {
    private _queryResultKeys: Set<string> | null = null;
    private _matcher: (item: TRow) => boolean = () => true;
    private localFilterKeys: Set<string>;
    private getSortValue: SortValueGetter<TRow>;

    // Ordering state of the current view: the keys the server returned for the active
    // query (in server order, extended by `appendResultKeys`), the applied sort, and
    // whether the server has more items beyond the loaded ones.
    private _view: {
        resultKeys: string[];
        sort: IDataSourceQuery["sort"];
        searching: boolean;
        hasMore: boolean;
    } | null = null;

    constructor(private config: QueryMatcherConfig<TRow>) {
        this.localFilterKeys = new Set(Object.keys(config.localFilters));
        this.getSortValue = config.getSortValue ?? getValueByPath;

        makeObservable<QueryMatcher<TRow>, "_matcher" | "_view">(this, {
            _matcher: observable.ref,
            _view: observable.ref,
            matcher: computed,
            updateFromQuery: action,
            appendResultKeys: action
        });
    }

    get matcher(): (item: TRow) => boolean {
        return this._matcher;
    }

    filter(items: TRow[]): TRow[] {
        return items.filter(this._matcher);
    }

    /**
     * Returns the items that belong in the current view, in the view's order.
     *
     * The cache is shared by views with different sorts, so its order means nothing to
     * this view. Instead, matching items are sorted by the applied sort (ties keep the
     * server order), and the result is cut off after the last item the server returned
     * for this view. That keeps locally created or updated items in their sort position,
     * and hides cached items that sort past the loaded pages until pagination reaches them.
     *
     * While searching, the server's (relevance) order is kept as is.
     */
    select(items: TRow[]): TRow[] {
        const matched = this.filter(items);
        const view = this._view;
        if (!view) {
            return matched;
        }

        const serverIndex = new Map(view.resultKeys.map((key, index) => [key, index]));
        const indexOf = (item: TRow) => serverIndex.get(this.getKey(item)) ?? -1;

        const sort = view.searching ? undefined : view.sort;
        const sorted = [...matched].sort((a, b) => {
            if (sort) {
                const result = compareValues(
                    this.getSortValue(a, sort.field),
                    this.getSortValue(b, sort.field)
                );
                if (result !== 0) {
                    return sort.direction === "ASC" ? result : -result;
                }
            }
            return indexOf(a) - indexOf(b);
        });

        if (!view.hasMore) {
            return sorted;
        }

        let lastLoaded = -1;
        sorted.forEach((item, index) => {
            if (serverIndex.has(this.getKey(item))) {
                lastLoaded = index;
            }
        });

        return lastLoaded < 0 ? sorted : sorted.slice(0, lastLoaded + 1);
    }

    private getKey(item: TRow): string {
        return String(item[this.config.keyField]);
    }

    hasServerSideFilters(params: IDataSourceQuery): boolean {
        if (params.search) {
            return true;
        }
        const filters = params.filters ?? {};
        return Object.keys(filters).some(key => !this.localFilterKeys.has(key));
    }

    updateFromQuery(params: IDataSourceQuery, resultKeys: string[], hasMore = false): void {
        if (this.hasServerSideFilters(params)) {
            this._queryResultKeys = new Set(resultKeys);
        } else {
            this._queryResultKeys = null;
        }
        this._matcher = this.buildMatcher(params);
        this._view = {
            resultKeys: [...resultKeys],
            sort: params.sort,
            searching: !!params.search,
            hasMore
        };
    }

    appendResultKeys(keys: string[], hasMore = false): void {
        if (this._queryResultKeys) {
            for (const key of keys) {
                this._queryResultKeys.add(key);
            }
        }
        if (this._view) {
            this._view = {
                ...this._view,
                resultKeys: [...this._view.resultKeys, ...keys],
                hasMore
            };
        }
    }

    private buildMatcher(params: IDataSourceQuery): (item: TRow) => boolean {
        const filters = params.filters ?? {};
        const queryResultKeys = this._queryResultKeys;
        const isSearching = !!params.search;
        const { keyField, localFilters } = this.config;

        const activeLocalFilters: Array<{ predicate: ItemPredicate<TRow>; value: unknown }> = [];
        for (const [key, predicate] of Object.entries(localFilters)) {
            const value = filters[key];
            if (value !== undefined && value !== null) {
                activeLocalFilters.push({ predicate, value });
            }
        }

        return (item: TRow) => {
            if (queryResultKeys) {
                if (!queryResultKeys.has(String(item[keyField]))) {
                    return false;
                }
            } else if (!isSearching) {
                for (const { predicate, value } of activeLocalFilters) {
                    if (!predicate(item, value)) {
                        return false;
                    }
                }
            }

            return true;
        };
    }
}

function getValueByPath(item: unknown, path: string): unknown {
    let current: unknown = item;
    for (const part of path.split(".")) {
        if (current === null || current === undefined || typeof current !== "object") {
            return undefined;
        }
        current = (current as Record<string, unknown>)[part];
    }
    return current;
}

/**
 * Compares two sort values in ascending order. Empty values sort first.
 * Strings are compared by code point, which keeps ISO dates in chronological order.
 */
function compareValues(a: unknown, b: unknown): number {
    const aEmpty = a === null || a === undefined || a === "";
    const bEmpty = b === null || b === undefined || b === "";
    if (aEmpty || bEmpty) {
        return aEmpty === bEmpty ? 0 : aEmpty ? -1 : 1;
    }

    const left = a instanceof Date ? a.getTime() : a;
    const right = b instanceof Date ? b.getTime() : b;

    if (typeof left === "number" && typeof right === "number") {
        return left - right;
    }
    if (typeof left === "boolean" && typeof right === "boolean") {
        return Number(left) - Number(right);
    }

    const leftString = String(left);
    const rightString = String(right);
    return leftString < rightString ? -1 : leftString > rightString ? 1 : 0;
}
