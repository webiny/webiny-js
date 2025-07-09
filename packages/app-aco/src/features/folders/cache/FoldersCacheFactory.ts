import { Folder } from "../Folder";
import { type IListCache, ListCache } from "~/features/folders/cache/ListCache";

export class FoldersCacheFactory {
    private cache: Map<string, IListCache<Folder>> = new Map();

    getCache(namespace: string) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new ListCache<Folder>());
        }

        return this.cache.get(cacheKey) as ListCache<Folder>;
    }

    private getCacheKey(namespace: string) {
        return namespace;
    }
}

export const folderCacheFactory = new FoldersCacheFactory();
