"use client";
import { useCallback, useState } from "react";
import { contentSdk } from "@webiny/cms-sdk";
import type { ResolvedContentEntryQuery } from "@webiny/website-builder-sdk";

export type { ResolvedContentEntryQuery, ContentEntryQuerySpec } from "@webiny/website-builder-sdk";

export interface ContentEntryList<T = unknown> {
    /** The loaded entries (first page + any loaded via loadMore). */
    items: T[];
    /** Whether more pages are available (and pagination is enabled). */
    hasMore: boolean;
    /** True while a loadMore fetch is in flight. */
    loading: boolean;
    /** Fetch and append the next page. No-op when nothing more to load. */
    loadMore: () => void;
}

interface PageState<T> {
    signature: string;
    items: T[];
    cursor: string | null;
    apiHasMore: boolean;
}

/**
 * Client hook for a query-mode `contentEntry` input. Seeds from the server-resolved
 * first page (SSR-safe — no fetch on mount) and loads further pages on demand from
 * the embedded query + cursor. Re-seeds when the underlying query changes (e.g. the
 * editor tweaks sort/limit/search in preview).
 *
 * Pagination is active only when the input enables it (the resolved value then
 * carries a `query`); otherwise `hasMore` is always false and `loadMore` is a no-op.
 */
export function useContentEntryList<T = unknown>(
    value: ResolvedContentEntryQuery<T> | null | undefined
): ContentEntryList<T> {
    const query = value?.query;
    const signature = JSON.stringify({ query, cursor: value?.pageInfo?.cursor ?? null });

    const seed = (): PageState<T> => ({
        signature,
        items: value?.items ?? [],
        cursor: value?.pageInfo?.cursor ?? null,
        apiHasMore: value?.pageInfo?.hasMore ?? false
    });

    const [state, setState] = useState<PageState<T>>(seed);
    const [loading, setLoading] = useState(false);

    // Re-seed (on the client) when the resolved page changes — e.g. the editor edits
    // the query. The first/SSR render already has the right data via useState.
    if (state.signature !== signature) {
        setState(seed());
    }

    const loadMore = useCallback(() => {
        if (!query || loading || !state.apiHasMore || !state.cursor) {
            return;
        }
        setLoading(true);
        contentSdk
            .listEntries({ ...query, after: state.cursor })
            .then(result => {
                setState(prev => ({
                    ...prev,
                    items: [...prev.items, ...(result.data as T[])],
                    cursor: result.meta.cursor,
                    apiHasMore: result.meta.hasMoreItems
                }));
            })
            .finally(() => setLoading(false));
    }, [query, loading, state.apiHasMore, state.cursor]);

    return {
        items: state.items,
        hasMore: Boolean(query) && state.apiHasMore,
        loading,
        loadMore
    };
}
