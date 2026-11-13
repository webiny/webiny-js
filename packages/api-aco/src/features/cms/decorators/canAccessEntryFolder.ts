import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import type { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";

/**
 * Checks folder level permissions for the content of the given folder.
 * Entries without a folder, or in the root folder, are not restricted.
 */
export const canAccessEntryFolder = async (
    folderLevelPermissions: FolderLevelPermissions.Interface,
    folderId: string | null | undefined,
    rwd: "r" | "w" | "d"
): Promise<boolean> => {
    if (!folderId || folderId === ROOT_FOLDER) {
        return true;
    }

    const permissions = await folderLevelPermissions.getFolderLevelPermissions(folderId);
    return folderLevelPermissions.canAccessFolderContent({ permissions, rwd });
};

/**
 * Removes entries located in folders the identity cannot read.
 */
export const filterEntriesByFolderAccess = async <T extends Pick<CmsEntry, "location">>(
    folderLevelPermissions: FolderLevelPermissions.Interface,
    entries: T[]
): Promise<T[]> => {
    const permitted = await Promise.all(
        entries.map(entry =>
            canAccessEntryFolder(folderLevelPermissions, entry.location?.folderId, "r")
        )
    );
    return entries.filter((_, index) => permitted[index]);
};

export const isNotAuthorizedError = (error: { code?: string }): boolean => {
    return error.code === "Cms/Entry/NotAuthorized";
};

/**
 * Loads a revision and checks write access to its folder. Returns an error when access is
 * denied; `null` when the operation may continue (a missing revision is left to the decoratee).
 */
export const checkRevisionFolderWriteAccess = async (
    folderLevelPermissions: FolderLevelPermissions.Interface,
    getRevisionById: GetRevisionByIdUseCase.Interface,
    model: CmsModel,
    id: string
): Promise<EntryNotAuthorizedError | null> => {
    const entryResult = await getRevisionById.execute(model, id);
    if (entryResult.isFail()) {
        return isNotAuthorizedError(entryResult.error) ? new EntryNotAuthorizedError() : null;
    }

    const folderId = entryResult.value.location?.folderId;
    if (!(await canAccessEntryFolder(folderLevelPermissions, folderId, "w"))) {
        return new EntryNotAuthorizedError();
    }

    return null;
};
