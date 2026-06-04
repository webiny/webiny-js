import { makeObservable, observable, computed, action } from "mobx";
import type { IDataSourceQuery } from "./abstractions.js";

type ItemPredicate<TRow> = (item: TRow, value: unknown) => boolean;

export interface QueryMatcherConfig<TRow> {
    keyField: keyof TRow & string;
    localFilters: Record<string, ItemPredicate<TRow>>;
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

    constructor(private config: QueryMatcherConfig<TRow>) {
        this.localFilterKeys = new Set(Object.keys(config.localFilters));

        makeObservable<QueryMatcher<TRow>, "_matcher">(this, {
            _matcher: observable.ref,
            matcher: computed,
            updateFromQuery: action,
            appendResultKeys: action
        });
    }

    get matcher(): (item: TRow) => boolean {
        return this._matcher;
    }

    hasServerSideFilters(params: IDataSourceQuery): boolean {
        if (params.search) {
            return true;
        }
        const filters = params.filters ?? {};
        return Object.keys(filters).some(key => !this.localFilterKeys.has(key));
    }

    updateFromQuery(params: IDataSourceQuery, resultKeys: string[]): void {
        if (this.hasServerSideFilters(params)) {
            this._queryResultKeys = new Set(resultKeys);
        } else {
            this._queryResultKeys = null;
        }
        this._matcher = this.buildMatcher(params);
    }

    appendResultKeys(keys: string[]): void {
        if (this._queryResultKeys) {
            for (const key of keys) {
                this._queryResultKeys.add(key);
            }
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
