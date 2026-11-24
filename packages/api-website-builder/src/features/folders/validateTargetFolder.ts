import type { GetFolderUseCase } from "@webiny/api-aco/features/folder/GetFolder/index.js";
import { ROOT_FOLDER } from "~/constants.js";

export type TargetFolderProblem = "notFound" | "notAuthorized" | "invalidType";

/**
 * Security: a page / redirect may only be moved into an existing folder of the matching type,
 * which the current identity can access (GetFolderUseCase applies folder level permissions).
 * Returns `null` when the target folder is valid.
 */
export const validateTargetFolder = async (
    getFolder: GetFolderUseCase.Interface | undefined,
    folderId: string,
    expectedType: string
): Promise<TargetFolderProblem | null> => {
    if (folderId === ROOT_FOLDER) {
        return null;
    }
    // Folders are ACO entities; without ACO no folder other than root can exist.
    if (!getFolder) {
        return "notFound";
    }

    const result = await getFolder.execute(folderId);
    if (result.isFail()) {
        return result.error.code === "Aco/Folder/NotFound" ? "notFound" : "notAuthorized";
    }

    return result.value.type === expectedType ? null : "invalidType";
};
