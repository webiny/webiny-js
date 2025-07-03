import type { Page } from "~/features/pages/Page.js";
import { ListCache } from "~/features/pages/cache/ListCache.js";

export class PagesCacheFactory {
    private cache: ListCache<Page> = new ListCache<Page>();

    getCache(): ListCache<Page> {
        return this.cache;
    }
}

export const pageCacheFactory = new PagesCacheFactory();
