import { CmsEntryMeta } from "@webiny/api-headless-cms/types";

export interface ICmsAsset {
    id: string;
    key: string;
}

export interface ICmsAssetsFetcherResult {
    items: ICmsAsset[];
    meta: CmsEntryMeta;
}

export interface ICmsAssetsFetcher {
    (after?: string): Promise<ICmsAssetsFetcherResult>;
}
