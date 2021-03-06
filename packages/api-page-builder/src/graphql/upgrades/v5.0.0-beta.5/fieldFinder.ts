import { CmsContentModel, CmsContentModelField } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

interface MappedModels {
    [modelId: string]: {
        id: {
            [fieldId: string]: CmsContentModelField;
        };
        type: {
            [fieldType: string]: CmsContentModelField[];
        };
    };
}

export interface ModelFieldFinder {
    findById: (model: CmsContentModel | string, fieldId: string) => CmsContentModelField;
    findByType: (model: CmsContentModel | string, type: string) => CmsContentModelField[];
}

export const createFieldFinder = (models: CmsContentModel[]): ModelFieldFinder => {
    const modelsList: MappedModels = {};
    for (const model of models) {
        const values = {
            id: {},
            type: {}
        };
        for (const field of model.fields) {
            values.id[field.fieldId] = field;
            if (!values.type[field.type]) {
                values.type[field.type] = [];
            }
            values.type[field.type].push(field);
        }

        modelsList[model.modelId] = values;
    }

    return {
        findById: (model, fieldId) => {
            const modelId = typeof model === "string" ? model : model.modelId;
            if (!modelsList[modelId]) {
                throw new WebinyError("Could not find the model", "MODEL_NOT_FOUND_ERROR", {
                    modelId: modelId,
                    fieldId: fieldId
                });
            } else if (!modelsList[modelId].id[fieldId]) {
                throw new WebinyError("Could not find the model", "MODEL_NOT_FOUND_ERROR", {
                    modelId: modelId,
                    fieldId: fieldId
                });
            }
            return modelsList[modelId].id[fieldId];
        },
        findByType: (model, type) => {
            const modelId = typeof model === "string" ? model : model.modelId;
            if (!modelsList[modelId]) {
                throw new WebinyError("Could not find the model", "MODEL_NOT_FOUND_ERROR", {
                    modelId: model,
                    fieldType: type
                });
            } else if (!modelsList[modelId].type[type]) {
                throw new WebinyError("Could not find the model", "MODEL_NOT_FOUND_ERROR", {
                    modelId: model,
                    fieldType: type
                });
            }
            return modelsList[modelId].type[type];
        }
    };
};
