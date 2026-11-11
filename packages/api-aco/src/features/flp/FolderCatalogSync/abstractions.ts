import { createAbstraction } from "@webiny/feature/api";
import type { Folder } from "~/folder/folder.types.js";

export interface FolderCatalogSyncUpdatedParams {
    original: Folder;
    folder: Folder;
}

export interface IFolderCatalogSync {
    /** A folder was saved. */
    folderCreated(folder: Folder): Promise<void>;
    /**
     * A folder was changed. Its slug, parent or permissions may have changed, so the descendants'
     * paths and inherited permissions may need updating too.
     */
    folderUpdated(params: FolderCatalogSyncUpdatedParams): Promise<void>;
    /** A folder was deleted. */
    folderDeleted(folder: Folder): Promise<void>;
}

/**
 * Keeps whatever a storage derives from folders (folder permissions, descendant paths) in step with
 * folder changes. Called after the folder change is saved; the change stands even if this fails.
 */
export const FolderCatalogSync = createAbstraction<IFolderCatalogSync>("Aco/FolderCatalogSync");

export namespace FolderCatalogSync {
    export type Interface = IFolderCatalogSync;
    export type UpdatedParams = FolderCatalogSyncUpdatedParams;
}
