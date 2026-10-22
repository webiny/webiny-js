import { createAbstraction } from "@webiny/feature/api";

export interface ICmsEntryDeniedFolders {
    /**
     * Ids of the folders of these models' entries whose content the current identity cannot read
     * (Q77). Empty when folder-level permissions are not in use for the identity (e.g. API keys).
     * Folders without permission records and the root folder are readable, so they never appear.
     */
    listDeniedFolderIds(modelIds: string[]): Promise<string[]>;
}

/**
 * Folder read rules of CMS entries for list filters, as `CmsEntryAccess` applies them to one entry:
 * one `listFolderLevelPermissions` per folder type (`cms:<modelId>`), evaluated in memory with
 * `canAccessFolderContent`. Cached per identity and folder type for the request.
 */
export const CmsEntryDeniedFolders =
    createAbstraction<ICmsEntryDeniedFolders>("CmsEntryDeniedFolders");

export namespace CmsEntryDeniedFolders {
    export type Interface = ICmsEntryDeniedFolders;
}
