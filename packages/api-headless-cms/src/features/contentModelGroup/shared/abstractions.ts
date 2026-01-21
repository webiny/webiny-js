import { createAbstraction } from "@webiny/feature/api";
import type { CmsGroup, CmsIcon } from "~/types/index.js";
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

interface IModelGroup {
    slug: string;
    name: string;
    icon: CmsIcon;
}

export interface IModelGroupFactory {
    execute(): Promise<IModelGroup[]> | IModelGroup[];
}

export const ModelGroupFactory = createAbstraction<IModelGroupFactory>("ModelGroupFactory");
export namespace ModelGroupFactory {
    export type Interface = IModelGroupFactory;
    export type Return = Promise<IModelGroup[]> | IModelGroup[];
    export type Group = IModelGroup;
}
