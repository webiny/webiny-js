import type { ContentEntryInput, ContentEntryReference, ContentEntryQueryValue } from "~/types.js";

/**
 * Minimal CMS data loader the content-entry resolver depends on. Injected by the
 * caller (the render layer passes the CMS `contentSdk`) so this module stays
 * decoupled from `@webiny/cms-sdk`.
 */
export interface ContentEntryLoader {
    getEntry(params: { modelId: string; entryId: string }): Promise<unknown | null>;
    listEntries(params: {
        modelId: string;
        sort?: Record<string, "asc" | "desc">;
        limit?: number;
        search?: string;
        after?: string;
    }): Promise<{
        data: unknown[];
        meta: { cursor: string | null; hasMoreItems: boolean; totalCount: number };
    }>;
}

/**
 * The query params used to produce a page. Embedded in the query result so the
 * client can fetch further pages (loadMore) from `pageInfo.cursor`. Present only
 * when pagination is enabled on the input.
 */
export interface ContentEntryQuerySpec {
    modelId: string;
    sort?: Record<string, "asc" | "desc">;
    limit?: number;
    search?: string;
}

export interface ResolvedContentEntryQuery<T = unknown> {
    items: T[];
    pageInfo: { cursor: string | null; hasMore: boolean; totalCount: number };
    /** Continuation params for loadMore; present only when pagination is enabled. */
    query?: ContentEntryQuerySpec;
}

/**
 * The shape passed to a component for a content-entry input:
 * - manual, single  -> the resolved entry (or null)
 * - manual, list    -> an array of resolved entries
 * - query           -> `{ items, pageInfo, query? }`
 */
export type ResolvedContentEntry = unknown | unknown[] | ResolvedContentEntryQuery | null;

/**
 * Resolve a content-entry input's stored value into CMS entries. Used by the
 * server pre-pass (live/SSR) and the editor's reactive cache alike.
 */
export async function resolveContentEntryInput(
    input: ContentEntryInput,
    value:
        | ContentEntryReference
        | ContentEntryReference[]
        | ContentEntryQueryValue
        | null
        | undefined,
    loader: ContentEntryLoader
): Promise<ResolvedContentEntry> {
    if (input.mode === "query") {
        const query = (value as ContentEntryQueryValue | undefined) ?? {};
        const modelId = input.models[0];
        if (!modelId) {
            return { items: [], pageInfo: { cursor: null, hasMore: false, totalCount: 0 } };
        }
        const listParams: ContentEntryQuerySpec = {
            modelId,
            sort: query.sort ? { [query.sort.field]: query.sort.order } : undefined,
            limit: query.limit ?? input.query?.limit?.default,
            search: query.search
        };
        const result = await loader.listEntries(listParams);
        return {
            items: result.data,
            pageInfo: {
                cursor: result.meta.cursor,
                hasMore: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            },
            // Embed the query so the client can load further pages — only when
            // pagination is enabled on the input.
            ...(input.query?.pagination ? { query: listParams } : {})
        };
    }

    // Manual mode — resolve stored references into entries.
    if (input.list) {
        const refs = Array.isArray(value) ? (value as ContentEntryReference[]) : [];
        const entries = await Promise.all(
            refs.map(ref => loader.getEntry({ modelId: ref.modelId, entryId: ref.id }))
        );
        return entries.filter(entry => entry !== null);
    }

    const ref = value as ContentEntryReference | null | undefined;
    if (!ref) {
        return null;
    }
    return loader.getEntry({ modelId: ref.modelId, entryId: ref.id });
}
