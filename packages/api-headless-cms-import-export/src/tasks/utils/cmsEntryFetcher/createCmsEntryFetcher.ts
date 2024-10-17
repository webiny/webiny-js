import type { ICmsEntryFetcher } from "./abstractions/CmsEntryFetcher";

export const createCmsEntryFetcher = (fetcher: ICmsEntryFetcher): ICmsEntryFetcher => {
    return fetcher;
};
