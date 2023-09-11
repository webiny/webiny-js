import { createModelImportValidation } from "~/crud/contentModel/validation";
import {
    HeadlessCmsImportStructureParamsDataModel,
    ValidatedCmsModel,
    ValidatedCmsModelResult
} from "~/export/types";
import { CmsGroup, CmsModel } from "~/types";
import { createZodError } from "@webiny/utils";

const modelFieldsToCheck = ["modelId", "singularApiName", "pluralApiName"];

interface Params {
    groups: Pick<CmsGroup, "id">[];
    models: CmsModel[];
    input: HeadlessCmsImportStructureParamsDataModel[];
}

export const validateModels = async (params: Params): Promise<ValidatedCmsModelResult[]> => {
    const { groups, models, input } = params;

    const validation = createModelImportValidation();

    return await Promise.all(
        input.map(async model => {
            const result = await validation.safeParseAsync(model);
            if (!result.success) {
                const error = createZodError(result.error);
                return {
                    model: model as ValidatedCmsModel,
                    error: {
                        message: error.message,
                        code: error.code,
                        data: error.data
                    }
                };
            }
            const data = result.data as unknown as ValidatedCmsModel;
            const group = groups.find(g => g.id === data.group);
            if (!group) {
                return {
                    model: data,
                    error: {
                        message: `The model group "${data.group}" does not exist.`,
                        code: "MODEL_GROUP_NOT_FOUND"
                    }
                };
            } else if (!model.fields?.length) {
                return {
                    model: data,
                    error: {
                        message: `Model is missing fields.`,
                        code: "MODEL_FIELDS_MISSING"
                    }
                };
            }
            for (const field of modelFieldsToCheck) {
                const fieldValue = (
                    (data[field as keyof typeof data] as string) || ""
                ).toLowerCase();

                const existing = models.find(m => {
                    const value = m[field as keyof typeof m] || "";
                    if (typeof value !== "string") {
                        return false;
                    }
                    return value.toLowerCase() === fieldValue;
                });
                if (!existing) {
                    continue;
                }
                return {
                    model: data,
                    error: {
                        message: `The model "${data.modelId}" with ${field} "${fieldValue}" exists.`,
                        code: "MODEL_EXISTS"
                    }
                };
            }

            return {
                model: data
            };
        })
    );
};
