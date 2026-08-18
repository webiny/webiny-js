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

export interface ResolvedContentEntryQuery {
    items: unknown[];
    pageInfo: { cursor: string | null; hasMore: boolean; totalCount: number };
}

/**
 * The shape passed to a component for an `autoLoad` content-entry input:
 * - manual, single  -> the resolved entry (or null)
 * - manual, list    -> an array of resolved entries
 * - query           -> `{ items, pageInfo }`
 */
export type ResolvedContentEntry = unknown | unknown[] | ResolvedContentEntryQuery | null;

/**
 * Entry meta fields that sort by their bare name. Every other field is a model
 * value field and must be prefixed with `values_` for the read API.
 */
const META_SORT_FIELDS = new Set([
    "id",
    "entryId",
    "createdOn",
    "modifiedOn",
    "savedOn",
    "deletedOn",
    "restoredOn",
    "firstPublishedOn",
    "lastPublishedOn"
]);

/**
 * Map a field id to the sort key the CMS read API expects: meta fields stay bare
 * (`createdOn`), value fields are prefixed (`title` -> `values_title`). The read
 * API converts, e.g., `{ values_title: "asc" }` into `["values_title_ASC"]`.
 */
const toSortKey = (field: string): string =>
    META_SORT_FIELDS.has(field) ? field : `values_${field}`;

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
        const result = await loader.listEntries({
            modelId,
            sort: query.sort ? { [toSortKey(query.sort.field)]: query.sort.order } : undefined,
            limit: query.limit ?? input.query?.limit?.default,
            search: query.search
        });
        return {
            items: result.data,
            pageInfo: {
                cursor: result.meta.cursor,
                hasMore: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            }
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
