import { FoldersCache } from "~/Domain/Caches/FoldersCache";

export class FoldersCacheFactory {
    private cache: Map<string, FoldersCache> = new Map();

    getCache(namespace: string) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new FoldersCache());
        }

        return this.cache.get(cacheKey) as FoldersCache;
    }

    private getCacheKey(namespace: string) {
        return namespace;
    }
}

export const folderCacheFactory = new FoldersCacheFactory();
