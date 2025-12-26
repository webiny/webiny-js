import type { CmsEntry, CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";

export interface ICmsEntryFetcherResult {
    items: CmsEntry[];
    meta: CmsEntryMeta;
}

export interface ICmsEntryFetcher {
    (after?: string | null): Promise<ICmsEntryFetcherResult>;
}
