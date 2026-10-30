import type { StepFormFoldersOptions } from "./StepFormOptions.js";
import type { StepFormReferencesOptions } from "./StepFormOptions.js";

/*
 * True for a folder id the admin's folder list does not contain whose reference resolved as
 * restricted (R292, QBZ-15): the condition is kept as stored and its picker is disabled. A listed
 * folder is never restricted.
 */
export const isRestrictedFolder = (
    folderId: string | null,
    folders: StepFormFoldersOptions,
    references: StepFormReferencesOptions
): boolean => {
    if (folderId === null) {
        return false;
    }
    const listed = folders.items.some(folder => folder.id === folderId);
    if (listed) {
        return false;
    }
    const reference = references.folders.get(folderId);
    return reference !== undefined && reference.state === "restricted";
};
