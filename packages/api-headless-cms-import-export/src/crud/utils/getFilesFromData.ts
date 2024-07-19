import zod from "zod";
import { createZodError } from "@webiny/utils";
import { CmsImportExportFileType, ICmsImportExportFile } from "~/types";

const validateFiles = zod.object({
    files: zod.array(
        zod.object({
            get: zod.string().url(),
            head: zod.string().url(),
            type: zod.enum([CmsImportExportFileType.ENTRIES, CmsImportExportFileType.ASSETS])
        })
    )
});
/**
 * Throws {WebinyError} if the provided JSON data is invalid.
 */
export const getFilesFromData = (data: string): ICmsImportExportFile[] => {
    let json: unknown;
    try {
        json = JSON.parse(data);
    } catch (ex) {
        throw new Error("Invalid JSON data provided.");
    }

    const result = validateFiles.safeParse(json);
    if (!result.success) {
        throw createZodError(result.error);
    }

    return result.data.files;
};
