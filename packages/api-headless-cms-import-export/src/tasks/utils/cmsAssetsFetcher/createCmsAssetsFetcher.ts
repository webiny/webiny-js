import { ICmsAssetsFetcher } from "./abstractions/CmsAssetsFetcher";

export const createCmsAssetsFetcher = (fetcher: ICmsAssetsFetcher): ICmsAssetsFetcher => {
    return fetcher;
};
