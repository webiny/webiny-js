import { createModelImportValidation } from "~/crud/contentModel/validation";
import {
    CmsImportAction,
    CmsImportError,
    HeadlessCmsImportStructureParamsDataModel,
    ValidatedCmsModel,
    ValidatedCmsModelResult
} from "~/export/types";
import { CmsDynamicZoneTemplate, CmsGroup, CmsModel, CmsModelField } from "~/types";
import { createZodError } from "@webiny/utils";

interface CreateModelValidationParams {
    model: ValidatedCmsModel;
    models: CmsModel[];
}

interface AddCodeMessageParams {
    action: CmsImportAction;
}

const addCodeMessage = (params: AddCodeMessageParams) => {
    if (params.action !== CmsImportAction.CODE) {
        return params;
    }
    return {
        ...params,
        errors: [
            {
                message: `The model is defined via plugin and it cannot be updated.`,
                code: "MODEL_IS_A_PLUGIN"
            }
        ]
    };
};

interface ValidationResult {
    errors?: CmsImportError[];
    action: CmsImportAction;
}

const validateModel = (params: CreateModelValidationParams): ValidationResult => {
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

    const UPDATE_KEYWORD = existingModelId?.isPlugin
        ? CmsImportAction.CODE
        : CmsImportAction.UPDATE;
    /**
     * There are few cases that we must address:
     *
     * 1. modelId, singular and plural names do not exist in any of the models
     * - this is OK, we can create the model
     */
    if (!existingModelId && !existingSingularApiName && !existingPluralApiName) {
        return {
            action: CmsImportAction.CREATE
        };
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
        return addCodeMessage({
            action: UPDATE_KEYWORD
        });
    }
    /**
     * 3. modelId already exists, but singular and plural names do not
     *  - this is OK, we can update the model
     */
    if (existingModelId && !existingSingularApiName && !existingPluralApiName) {
        return addCodeMessage({
            action: UPDATE_KEYWORD
        });
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
        return addCodeMessage({
            action: UPDATE_KEYWORD
        });
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
        return addCodeMessage({
            action: UPDATE_KEYWORD
        });
    }
    /**
     * 6. modelId already exists, but singular and plural names are in different models.
     */
    if (
        existingModelId &&
        (existingSingularApiName?.modelId !== existingModelId.modelId ||
            existingPluralApiName?.modelId !== existingModelId.modelId)
    ) {
        return {
            action: CmsImportAction.NONE,
            errors: [
                {
                    message: `The model has singular or plural API names same as some other model.`,
                    code: "MODEL_API_NAMES_ERROR"
                }
            ]
        };
    }

    return {
        action: CmsImportAction.NONE,
        errors: [
            {
                message: `The model cannot be imported.`,
                code: "MODEL_IMPORT_ERROR",
                data: {
                    modelId: existingModelId?.modelId,
                    singularApiName: existingSingularApiName?.modelId,
                    pluralApiName: existingPluralApiName?.modelId
                }
            }
        ]
    };
};

interface InputGroup extends Pick<CmsGroup, "id" | "slug"> {
    target: string;
}

interface Params {
    groups: InputGroup[];
    models: CmsModel[];
    input: HeadlessCmsImportStructureParamsDataModel[];
}

interface GetRelatedModelsParams {
    fields: CmsModelField[];
    models: CmsModel[];
}

const getRelatedModels = (params: GetRelatedModelsParams): string[] => {
    const { fields, models } = params;

    const result: string[] = [];
    for (const field of fields) {
        if (field.type === "ref") {
            for (const model of field.settings?.models || []) {
                result.push(model.modelId);
            }
        } else if (field.type === "object") {
            result.push(...getRelatedModels({ fields: field.settings?.fields || [], models }));
        } else if (field.type === "dynamicZone") {
            const templates = (field.settings?.templates || []) as CmsDynamicZoneTemplate[];
            for (const tpl of templates) {
                result.push(
                    ...getRelatedModels({
                        fields: tpl.fields || [],
                        models
                    })
                );
            }
        }
    }

    return Array.from(new Set(result));
};

export const validateModels = async (params: Params): Promise<ValidatedCmsModelResult[]> => {
    const { groups, models, input } = params;

    const validation = createModelImportValidation();

    return await Promise.all(
        input.map(async (model): Promise<ValidatedCmsModelResult> => {
            const result = await validation.safeParseAsync(model);
            if (!result.success) {
                const error = createZodError(result.error);
                return {
                    model: model as ValidatedCmsModel,
                    action: CmsImportAction.NONE,
                    error: {
                        message: error.message,
                        code: error.code,
                        data: error.data
                    }
                };
            }
            const data = result.data as unknown as ValidatedCmsModel;
            const group = groups.find(g => g.id === data.group || g.target === data.group);
            if (!group) {
                return {
                    model: data,
                    action: CmsImportAction.NONE,
                    error: {
                        message: `The model group "${data.group}" does not exist.`,
                        code: "MODEL_GROUP_NOT_FOUND"
                    }
                };
            } else if (!model.fields?.length) {
                return {
                    model: data,
                    action: CmsImportAction.NONE,
                    error: {
                        message: `Model is missing fields.`,
                        code: "MODEL_FIELDS_MISSING"
                    }
                };
            }

            const targetModel: ValidatedCmsModel = {
                ...data,
                group: group.id
            };

            const modelValidationResult = validateModel({
                model: targetModel,
                models
            });

            if (!modelValidationResult.errors?.length) {
                return {
                    model: targetModel,
                    related: getRelatedModels({
                        fields: targetModel.fields,
                        models
                    }),
                    action: modelValidationResult.action
                };
            }
            return {
                model: targetModel,
                action: modelValidationResult.action,
                error: modelValidationResult.errors[0]
            };
        })
    );
};
