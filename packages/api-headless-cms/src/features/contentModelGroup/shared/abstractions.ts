import { createAbstraction } from "@webiny/feature/api";
import type { CmsGroup, CmsIcon } from "~/types/index.js";
import type { ICache } from "~/utils/caching/types.js";
import type { CmsGroupPlugin } from "~/plugins/CmsGroupPlugin.js";

/**
 * Multi-instance DI token holding the code-defined CmsGroupPlugin instances
 * (previously read from the plugins container via byType). PluginGroupsProvider
 * resolves all of these to expose plugin-defined groups.
 */
export const CmsGroupPluginInstance = createAbstraction<CmsGroupPlugin>("CmsGroupPluginInstance");

export namespace CmsGroupPluginInstance {
    export type Interface = CmsGroupPlugin;
}

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
    execute(): Promise<IModelGroup[]>;
}

/** Provide code-defined content model groups. */
export const ModelGroupFactory = createAbstraction<IModelGroupFactory>("ModelGroupFactory");
export namespace ModelGroupFactory {
    export type Interface = IModelGroupFactory;
    export type Return = Promise<IModelGroup[]>;
    export type Group = IModelGroup;
}
