import { type IListCache, ListCache } from "./ListCache.js";
import type { Page } from "./Page.js";

export class PagesCacheFactory {
    private cache: IListCache<Page> = new ListCache<Page>();

    getCache(): IListCache<Page> {
        return this.cache;
    }
}

export const pageCacheFactory = new PagesCacheFactory();
