import { createAbstraction } from "@webiny/feature/api";
import type { CmsGroup } from "~/types/index.js";
import type { ICache } from "~/utils/caching/types.js";

/**
 * PluginGroupsProvider provides access to plugin-defined (code) groups.
 */
export interface IPluginGroupsProvider {
    getGroups(): Promise<CmsGroup[]>;
}

export const PluginGroupsProvider =
    createAbstraction<IPluginGroupsProvider>("PluginGroupsProvider");

export namespace PluginGroupsProvider {
    export type Interface = IPluginGroupsProvider;
}

export const GroupCache = createAbstraction<ICache<Promise<CmsGroup[]>>>("GroupCache");

export namespace GroupCache {
    export type Interface = ICache;
}
