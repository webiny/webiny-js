import { createAbstraction } from "@webiny/feature/api";
import type { PluginsContainer as PluginsContainerType } from "@webiny/plugins";
import type { CmsEntry, CmsModel } from "~/types/index.js";

export const PluginsContainer = createAbstraction<PluginsContainerType>("PluginsContainer");

export namespace PluginsContainer {
    export type Interface = PluginsContainerType;
}

/**
 * EntryToStorageTransform - Transforms domain entry to storage format.
 * Legacy abstraction for the utility function.
 */
export interface IEntryToStorageTransform {
    (model: CmsModel, entry: CmsEntry): Promise<CmsEntry>;
}

export const EntryToStorageTransform = createAbstraction<IEntryToStorageTransform>(
    "EntryToStorageTransform"
);

export namespace EntryToStorageTransform {
    export type Interface = IEntryToStorageTransform;
}

/**
 * EntryFromStorageTransform - Transforms storage entry to domain format.
 * Legacy abstraction for the utility function.
 */
export interface IEntryFromStorageTransform {
    (model: CmsModel, entry: CmsEntry): Promise<CmsEntry>;
}

export const EntryFromStorageTransform = createAbstraction<IEntryFromStorageTransform>(
    "EntryFromStorageTransform"
);

export namespace EntryFromStorageTransform {
    export type Interface = IEntryFromStorageTransform;
}
