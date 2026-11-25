import zod from "zod";

/**
 * Folder permissions are resolved from the folder type, so the type must be known before anything else runs.
 * The rest of the input is validated by the folder model.
 */
export const createFolderValidation = zod.looseObject({
    type: zod.string().min(1)
});
