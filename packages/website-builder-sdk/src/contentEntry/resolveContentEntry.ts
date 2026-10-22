import type { ContentEntryReference, ContentEntryQueryValue } from "~/types.js";

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
 * client can fetch further pages (loadMore) from `pageInfo.cursor`.
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
    /** Continuation params for loadMore. */
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
 * Detect whether a raw binding value is a `ContentEntryQueryValue` (query mode)
 * rather than a manual `ContentEntryReference`.
 *
 * Query values carry `modelId` but NOT `id`; manual references carry both.
 */
export function isQueryValue(value: unknown): value is ContentEntryQueryValue {
    return (
        typeof value === "object" &&
        value !== null &&
        "modelId" in value &&
        !("id" in value) &&
        !Array.isArray(value)
    );
}

/**
 * Detect whether a content-entry input's value is already a resolved CMS entry
 * rather than a bare reference that needs fetching.
 */
export function isAlreadyResolved(value: unknown, list: boolean): boolean {
    if (value == null) {
        return false;
    }
    // Query result — already resolved if it has `items`.
    if (typeof value === "object" && "items" in (value as any)) {
        return true;
    }
    // List of resolved entries — each has `values` (CMS entry shape).
    if (list && Array.isArray(value) && value.length > 0) {
        const first = value[0];
        return typeof first === "object" && first !== null && "values" in first;
    }
    // Single resolved entry.
    if (!list && typeof value === "object" && "values" in (value as any)) {
        return true;
    }
    return false;
}

/**
 * Resolve a content-entry binding value into CMS entries. Works entirely from
 * the value shape — no component manifest needed.
 *
 * - `{ id, modelId }` → fetch single entry
 * - `[{ id, modelId }, ...]` → fetch multiple entries
 * - `{ modelId, sort?, limit?, search? }` → list query
 */
export async function resolveContentEntryValue(
    value:
        | ContentEntryReference
        | ContentEntryReference[]
        | ContentEntryQueryValue
        | null
        | undefined,
    list: boolean,
    loader: ContentEntryLoader
): Promise<ResolvedContentEntry> {
    if (value == null) {
        return list ? [] : null;
    }

    // Query mode: value is `{ modelId, sort?, limit?, search? }`.
    if (isQueryValue(value)) {
        const query = value;
        const listParams: ContentEntryQuerySpec = {
            modelId: query.modelId,
            sort: query.sort ? { [query.sort.field]: query.sort.order } : undefined,
            limit: query.limit,
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
            query: listParams
        };
    }

    // Manual list: value is `[{ id, modelId }, ...]`.
    if (Array.isArray(value)) {
        const refs = value as ContentEntryReference[];
        const entries = await Promise.all(
            refs.map(ref => loader.getEntry({ modelId: ref.modelId, entryId: ref.id }))
        );
        return entries.filter(entry => entry !== null);
    }

    // Manual single: value is `{ id, modelId }`.
    const ref = value as ContentEntryReference;
    return loader.getEntry({ modelId: ref.modelId, entryId: ref.id });
}
