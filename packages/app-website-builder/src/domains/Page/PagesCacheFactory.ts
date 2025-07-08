import { ListCache } from "./ListCache.js";
import type { Page } from "./Page.js";

export class PagesCacheFactory {
    private cache: ListCache<Page> = new ListCache<Page>();

    getCache(): ListCache<Page> {
        return this.cache;
    }
}

export const pageCacheFactory = new PagesCacheFactory();
