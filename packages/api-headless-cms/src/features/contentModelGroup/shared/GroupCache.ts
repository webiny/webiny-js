import { createImplementation } from "@webiny/feature/api";
import { GroupCache as GroupCacheAbstraction } from "./abstractions.js";
import { createMemoryCache } from "~/utils/index.js";
import type { ICacheKey } from "~/utils/caching/types.js";

/**
 * GroupCache implementation
 *
 * A simple promise deduplication cache that prevents duplicate concurrent requests.
 * Repositories are responsible for:
 * - Creating cache keys
 * - Providing data loader functions
 * - Implementing the actual data fetching logic
 */
class GroupCacheImpl implements GroupCacheAbstraction.Interface {
    private cache = createMemoryCache<Promise<any>>();

    getOrSet<T>(cacheKey: ICacheKey, loader: () => Promise<T>): Promise<T> {
        return this.cache.getOrSet(cacheKey, loader);
    }

    clear(): void {
        this.cache.clear();
    }
}

export const GroupCache = createImplementation({
    abstraction: GroupCacheAbstraction,
    implementation: GroupCacheImpl,
    dependencies: []
});
