import {
    computed,
    ref,
    shallowRef,
    toValue,
    watch,
    type ComputedRef,
    type MaybeRefOrGetter,
    type Ref
} from "vue";
import { contentSdk } from "@webiny/cms-sdk";
import type { ResolvedContentEntryQuery } from "@webiny/website-builder-sdk";

export type { ResolvedContentEntryQuery, ContentEntryQuerySpec } from "@webiny/website-builder-sdk";

export interface ContentEntryList<T = unknown> {
    /** The loaded entries (first page + any loaded via loadMore). */
    items: Ref<T[]>;
    /** Whether more pages are available (and pagination is enabled). */
    hasMore: ComputedRef<boolean>;
    /** True while a loadMore fetch is in flight. */
    loading: Ref<boolean>;
    /** Fetch and append the next page. No-op when nothing more to load. */
    loadMore: () => void;
}

/**
 * Composable for a query-mode `contentEntry` input. Seeds from the server-resolved
 * first page (SSR-safe — no fetch on mount) and loads further pages on demand from
 * the embedded query + cursor. Re-seeds when the underlying query changes (e.g. the
 * editor tweaks sort/limit/search in preview).
 *
 * Pass a getter so the composable sees new values: `useContentEntryList(() => props.inputs.posts)`.
 *
 * Pagination is active only when the input enables it (the resolved value then
 * carries a `query`); otherwise `hasMore` is always false and `loadMore` is a no-op.
 */
export function useContentEntryList<T = unknown>(
    value: MaybeRefOrGetter<ResolvedContentEntryQuery<T> | null | undefined>
): ContentEntryList<T> {
    const current = computed(() => toValue(value));
    const signature = computed(() =>
        JSON.stringify({
            query: current.value?.query,
            cursor: current.value?.pageInfo?.cursor ?? null
        })
    );

    const items = shallowRef<T[]>([]);
    const cursor = ref<string | null>(null);
    const apiHasMore = ref(false);
    const loading = ref(false);
    // Bumped on every re-seed, so a page requested for an earlier query is dropped.
    let generation = 0;

    const seed = () => {
        generation++;
        loading.value = false;
        items.value = current.value?.items ?? [];
        cursor.value = current.value?.pageInfo?.cursor ?? null;
        apiHasMore.value = current.value?.pageInfo?.hasMore ?? false;
    };

    seed();
    watch(signature, seed);

    const loadMore = () => {
        const query = current.value?.query;
        if (!query || loading.value || !apiHasMore.value || !cursor.value) {
            return;
        }
        loading.value = true;
        const requestGeneration = generation;
        contentSdk
            .listEntries({ ...query, after: cursor.value })
            .then(result => {
                if (requestGeneration !== generation) {
                    return;
                }
                items.value = [...items.value, ...(result.data as T[])];
                cursor.value = result.meta.cursor;
                apiHasMore.value = result.meta.hasMoreItems;
            })
            .catch(error => {
                console.error("Failed to load more content entries.", error);
            })
            .finally(() => {
                if (requestGeneration === generation) {
                    loading.value = false;
                }
            });
    };

    return {
        items,
        hasMore: computed(() => Boolean(current.value?.query) && apiHasMore.value),
        loading,
        loadMore
    };
}
