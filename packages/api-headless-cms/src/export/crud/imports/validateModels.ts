import { createModelImportValidation } from "~/crud/contentModel/validation";
import {
    CmsImportError,
    HeadlessCmsImportStructureParamsDataModel,
    ValidatedCmsModel,
    ValidatedCmsModelResult
} from "~/export/types";
import { CmsGroup, CmsModel } from "~/types";
import { createZodError } from "@webiny/utils";

interface CreateModelValidationParams {
    model: ValidatedCmsModel;
    models: CmsModel[];
}

const createModelValidation = (params: CreateModelValidationParams) => {
    const { model, models } = params;
    /**
     * Let's check if model values that must be unique, already exist.
     */
    const existingModelId = models.find(
        m => m.modelId.toLowerCase() === model.modelId.toLowerCase()
    );
    const existingSingularApiName = models.find(
        m =>
            m.singularApiName.toLowerCase() === model.singularApiName.toLowerCase() ||
            m.singularApiName.toLowerCase() === model.pluralApiName.toString()
    );
    const existingPluralApiName = models.find(
        m =>
            m.pluralApiName.toLowerCase() === model.pluralApiName.toLowerCase() ||
            m.pluralApiName.toLowerCase() === model.singularApiName.toString()
    );
    const errors: CmsImportError[] = [];
    /**
     * There are few cases that we must address:
     */
    const validate = (): "create" | "update" | false => {
        /**
         * 1. modelId, singular and plural names do not exist in any of the models
         * - this is OK, we can create the model
         */
        if (!existingModelId && !existingSingularApiName && !existingPluralApiName) {
            return "create";
        }
        /**
         * 2. modelId, singular and plural names are a part of a single model
         * - this is OK, we can update the model
         */
        if (
            existingModelId &&
            existingSingularApiName &&
            existingPluralApiName &&
            existingModelId.modelId === existingSingularApiName.modelId &&
            existingModelId.modelId === existingPluralApiName.modelId
        ) {
            return "update";
        }
        /**
         * 3. modelId already exists, but singular and plural names do not
         *  - this is OK, we can update the model
         */
        if (existingModelId && !existingSingularApiName && !existingPluralApiName) {
            return "update";
        }
        /**
         * 4. modelId already exists, but only the singular name exists.
         * - this is OK, we can update the model
         */
        if (
            existingModelId &&
            existingSingularApiName?.modelId === existingModelId.modelId &&
            !existingPluralApiName
        ) {
            return "update";
        }
        /**
         * 5. modelId already exists, but only the plural name exists.
         * - this is OK, we can update the model
         */
        if (
            existingModelId &&
            existingPluralApiName?.modelId === existingModelId.modelId &&
            !existingSingularApiName
        ) {
            return "update";
        }
        /**
         * 6. modelId already exists, but singular and plural names are in different models.
         */
        if (
            existingModelId &&
            (existingSingularApiName?.modelId !== existingModelId.modelId ||
                existingPluralApiName?.modelId !== existingModelId.modelId)
        ) {
            errors.push({
                message: `The model with modelId "${model.modelId}" has singular or plural API names same as some other model.`,
                code: "MODEL_API_NAMES_ERROR"
            });
            return false;
        }
        errors.push({
            message: `The model with modelId "${model.modelId}" cannot be imported.`,
            code: "MODEL_IMPORT_ERROR",
            data: {
                modelId: existingModelId?.modelId,
                singularApiName: existingSingularApiName?.modelId,
                pluralApiName: existingPluralApiName?.modelId
            }
        });
        return false;
    };

    const result = validate();

    return {
        isValid: () => {
            return result !== false;
        },
        action: typeof result === "string" ? result : "unknown",
        errors
    };
};

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

            const modelValidation = createModelValidation({
                model: data,
                models
            });

            if (modelValidation.isValid()) {
                return {
                    model: data,
                    action: modelValidation.action
                };
            }
            return {
                model: data,
                error: modelValidation.errors[0]
            };
        })
    );
};
