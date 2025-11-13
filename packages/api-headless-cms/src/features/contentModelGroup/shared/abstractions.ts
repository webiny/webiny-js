import { createAbstraction } from "@webiny/feature/api";
import type { CmsGroup } from "~/types/index.js";
import type { ICacheKey } from "~/utils/caching/types.js";

/**
 * PluginGroupsProvider provides access to plugin-defined (code) groups.
 */
export interface IPluginGroupsProvider {
    getGroups(): Promise<CmsGroup[]>;
}

export const PluginGroupsProvider = createAbstraction<IPluginGroupsProvider>(
    "PluginGroupsProvider"
);

export namespace PluginGroupsProvider {
    export type Interface = IPluginGroupsProvider;
}

/**
 * GroupCache abstraction - Simple promise deduplication cache
 */
export interface IGroupCache {
    /**
     * Get or set a value in the cache using a loader function.
     * If a promise is already pending for this key, returns the existing promise.
     * Otherwise, executes the loader and caches the promise.
     */
    getOrSet<T>(cacheKey: ICacheKey, loader: () => Promise<T>): Promise<T>;

    /**
     * Clear all cached promises. Should be called after create/update/delete operations.
     */
    clear(): void;
}

export const GroupCache = createAbstraction<IGroupCache>("GroupCache");

export namespace GroupCache {
    export type Interface = IGroupCache;
}
