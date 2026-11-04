import { createAbstraction } from "@webiny/feature/api";
import type { FolderReadRule } from "@webiny/api-headless-cms-workflows/features/target/FolderReadRule.js";

export interface IWbPageDeniedFolders {
    /**
     * Ids of the page folders whose content the current identity cannot read (Q77). Empty when
     * folder-level permissions are not in use for the identity (e.g. API keys). Folders without
     * permission records and the root folder are readable, so they never appear.
     */
    listDeniedFolderIds(): Promise<string[]>;
    /**
     * The same rules as a `FolderReadRule` for many page checks of the current identity
     * (`WbPageAccess.canRead`), so the checks read no folder permissions of their own.
     */
    createFolderReadRule(): Promise<FolderReadRule>;
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
