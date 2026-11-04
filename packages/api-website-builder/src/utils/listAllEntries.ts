import { Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsEntryValues
} from "@webiny/api-headless-cms/types";

// Entries read per request: each holds a full element document, so a page is kept small.
const PAGE_SIZE = 100;

interface ListPage<T extends CmsEntryValues> {
    entries: CmsEntry<T>[];
    meta: CmsEntryMeta;
}

/**
 * Every entry matching `params`, read page by page through a CMS list use case.
 */
export const listAllEntries = async <T extends CmsEntryValues, E>(
    list: (params: CmsEntryListParams) => Promise<Result<ListPage<T>, E>>,
    params: Omit<CmsEntryListParams, "limit" | "after"> = {}
): Promise<Result<CmsEntry<T>[], E>> => {
    const entries: CmsEntry<T>[] = [];
    let after: string | null = null;

    do {
        const result = await list({ ...params, limit: PAGE_SIZE, after });
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        entries.push(...result.value.entries);
        after = result.value.meta.hasMoreItems ? result.value.meta.cursor : null;
    } while (after);

    return Result.ok(entries);
};
