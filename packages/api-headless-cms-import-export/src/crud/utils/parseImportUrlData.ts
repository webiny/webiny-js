import { CmsImportExportFileType } from "~/types";
import type { ICmsImportExportFile } from "~/types";
import zod from "zod";
import { WebinyError } from "@webiny/error";
import { createZodError } from "@webiny/utils";
import type { IExportedCmsModel } from "~/tasks/domain/abstractions/ExportContentEntriesController";
import type { GenericRecord } from "@webiny/api/types";

const validateData = zod.object({
    /**
     * Basic model validation.
     * We will check it more thoroughly in the next step.
     */
    model: zod.object({
        modelId: zod.string(),
        fields: zod
            .array(
                zod.object({
                    id: zod.string(),
                    fieldId: zod.string(),
                    type: zod.string(),
                    multipleValues: zod.boolean().optional(),
                    settings: zod
                        .object({
                            fields: zod.array(zod.object({}).passthrough()).optional(),
                            templates: zod.array(zod.object({}).passthrough()).optional()
                        })
                        .passthrough()
                        .optional()
                })
            )
            .min(1)
    }),
    files: zod.array(
        zod.object({
            get: zod.string().url(),
            head: zod.string().url(),
            key: zod.string(),
            checksum: zod.string(),
            type: zod.enum([CmsImportExportFileType.ENTRIES, CmsImportExportFileType.ASSETS])
        })
    )
});

export interface IParseImportUrlDataResult {
    model: IExportedCmsModel;
    files: ICmsImportExportFile[];
}

export const parseImportUrlData = (input: string | GenericRecord): IParseImportUrlDataResult => {
    let json: unknown;
    try {
        json = typeof input === "string" ? JSON.parse(input) : input;
    } catch (ex) {
        throw new WebinyError("Invalid input data provided.", "INVALID_INPUT_DATA");
    }

    const result = validateData.safeParse(json);
    if (!result.success) {
        throw createZodError(result.error);
    }
    return {
        model: result.data.model as unknown as IExportedCmsModel,
        files: result.data.files
    };
};
