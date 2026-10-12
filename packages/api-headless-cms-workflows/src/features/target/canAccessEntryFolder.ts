import type { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/api-headless-cms/constants.js";

export type EntryFolderRwd = "r" | "w" | "d";

/**
 * Folder-level permissions on a CMS entry's folder for the current identity, as the ACO CMS
 * decorators apply them: skipped when FLP is not in use for the identity (e.g. API keys) or the
 * entry is in the root folder. Shared with the Website Builder adapter, whose pages are CMS
 * entries (R78).
 */
export const canAccessEntryFolder = async (
    folderLevelPermissions: FolderLevelPermissions.Interface,
    folderId: string | null | undefined,
    rwd: EntryFolderRwd
): Promise<boolean> => {
    if (!folderLevelPermissions.canUseFolderLevelPermissions()) {
        return true;
    }
    if (!folderId || folderId === ROOT_FOLDER) {
        return true;
    }
    const permissions = await folderLevelPermissions.getFolderLevelPermissions(folderId);
    return folderLevelPermissions.canAccessFolderContent({ permissions, rwd });
};
