import { CmsModel } from "@webiny/api-headless-cms/types";
import { CmsImportExportFileType, ICmsImportExportFile } from "~/types";
import zod from "zod";
import { WebinyError } from "@webiny/error";
import { createZodError } from "@webiny/utils";

const validateData = zod.object({
    /**
     * Basic model validation.
     * We will check it more thoroughly in the next step.
     */
    model: zod
        .object({
            modelId: zod.string(),
            fields: zod
                .array(
                    zod
                        .object({
                            fieldId: zod.string(),
                            type: zod.string()
                        })
                        .passthrough()
                )
                .min(1)
        })
        .passthrough(),
    files: zod.array(
        zod.object({
            get: zod.string().url(),
            head: zod.string().url(),
            type: zod.enum([CmsImportExportFileType.ENTRIES, CmsImportExportFileType.ASSETS])
        })
    )
});

export interface IParseImportUrlDataResult {
    model: CmsModel;
    files: ICmsImportExportFile[];
}

export const parseImportUrlData = (data: string): IParseImportUrlDataResult => {
    let json: unknown;
    try {
        json = JSON.parse(data);
    } catch (ex) {
        throw new WebinyError("Invalid JSON data provided.", "INVALID_JSON_DATA");
    }

    const result = validateData.safeParse(json);
    if (!result.success) {
        throw createZodError(result.error);
    }
    return {
        model: result.data.model as unknown as CmsModel,
        files: result.data.files
    };
};
