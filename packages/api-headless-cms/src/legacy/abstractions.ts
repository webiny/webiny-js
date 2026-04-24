import { createAbstraction } from "@webiny/feature/api";
import type { PluginsContainer as PluginsContainerType } from "@webiny/plugins";
import type { CmsEntry, CmsEntryValues, CmsModel, CmsModelField } from "~/types/index.js";

export const PluginsContainer = createAbstraction<PluginsContainerType>("PluginsContainer");

export namespace PluginsContainer {
    export type Interface = PluginsContainerType;
}

/**
 * SearchableFieldsProvider - Provides searchable field paths for a model.
 * Legacy abstraction for the getSearchableFields utility function.
 */
export interface ISearchableFieldsProvider {
    (params: { fields: CmsModelField[] }): string[];
}

export const SearchableFieldsProvider = createAbstraction<ISearchableFieldsProvider>(
    "SearchableFieldsProvider"
);

export namespace SearchableFieldsProvider {
    export type Interface = ISearchableFieldsProvider;
}

/**
 * EntryToStorageTransform - Transforms domain entry to storage format.
 * Legacy abstraction for the utility function.
 */
export interface IEntryToStorageTransform {
    <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: CmsEntry<T>
    ): Promise<CmsEntry<T>>;
}

export const EntryToStorageTransform =
    createAbstraction<IEntryToStorageTransform>("EntryToStorageTransform");

export namespace EntryToStorageTransform {
    export type Interface = IEntryToStorageTransform;
}

/**
 * EntryFromStorageTransform - Transforms storage entry to domain format.
 * Legacy abstraction for the utility function.
 */
export interface IEntryFromStorageTransform {
    <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: CmsEntry<T>
    ): Promise<CmsEntry<T>>;
}

export const EntryFromStorageTransform = createAbstraction<IEntryFromStorageTransform>(
    "EntryFromStorageTransform"
);

export namespace EntryFromStorageTransform {
    export type Interface = IEntryFromStorageTransform;
}
