import { createAbstraction } from "@webiny/feature/api";

export interface IWbPageDeniedFolders {
    /**
     * Ids of the page folders whose content the current identity cannot read (Q77). Empty when
     * folder-level permissions are not in use for the identity (e.g. API keys). Folders without
     * permission records and the root folder are readable, so they never appear.
     */
    listDeniedFolderIds(): Promise<string[]>;
}

/**
 * Folder read rules of pages for list filters, as `WbPageAccess` applies them to one page: one
 * `listFolderLevelPermissions` of the `wb:page` folder type, evaluated in memory with
 * `canAccessFolderContent`. Cached per identity for the request.
 */
export const WbPageDeniedFolders = createAbstraction<IWbPageDeniedFolders>("WbPageDeniedFolders");

export namespace WbPageDeniedFolders {
    export type Interface = IWbPageDeniedFolders;
}
