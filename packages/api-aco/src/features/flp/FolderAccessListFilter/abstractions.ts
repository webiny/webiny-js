import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsEntryListParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { IListEntriesResult } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import type { ListFoldersParams } from "~/folder/folder.types.js";
import type { ListFoldersUseCase } from "~/features/folder/ListFolders/abstractions.js";

export interface FolderAccessListEntriesParams<T extends CmsEntryValues> {
    model: CmsModel;
    params?: CmsEntryListParams;
    /** Loads one page of entries. Throws when the list fails. */
    loader: (params?: CmsEntryListParams) => Promise<IListEntriesResult<T>>;
}

export type FolderAccessListFoldersLoader = (
    params: ListFoldersParams
) => ListFoldersUseCase.Return;

export interface IFolderAccessListFilter {
    /**
     * List entries, leaving out the ones in folders the current identity cannot read. The returned
     * `meta` describes the list the identity sees.
     */
    listEntries<T extends CmsEntryValues>(
        params: FolderAccessListEntriesParams<T>
    ): Promise<IListEntriesResult<T>>;
    /**
     * List folders, leaving out the ones the current identity cannot read, and attach each folder's
     * permissions as the identity sees them.
     */
    listFolders(
        params: ListFoldersParams,
        loader: FolderAccessListFoldersLoader
    ): ListFoldersUseCase.Return;
}

/**
 * Applies folder-level permissions to lists. A storage that can filter by folder while querying
 * provides its own; the default loads pages and drops what the identity cannot read.
 */
export const FolderAccessListFilter = createAbstraction<IFolderAccessListFilter>(
    "Aco/FolderAccessListFilter"
);

export namespace FolderAccessListFilter {
    export type Interface = IFolderAccessListFilter;
    export type ListEntriesParams<T extends CmsEntryValues> = FolderAccessListEntriesParams<T>;
    export type ListFoldersLoader = FolderAccessListFoldersLoader;
}
