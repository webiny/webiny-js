import type {
    CmsModelField,
    CmsModelFieldValidation
} from "@webiny/api-headless-cms/types/index.js";
import camelCase from "lodash/camelCase.js";

export interface CreateModelFieldParams
    extends Omit<CmsModelField, "id" | "storageId" | "fieldId" | "validation" | "listValidation"> {
    fieldId?: string;
    validation?: CmsModelFieldValidation[];
    listValidation?: CmsModelFieldValidation[];
}

export const createModelField = (params: CreateModelFieldParams): CmsModelField => {
    const {
        label,
        fieldId: initialFieldId,
        type,
        settings = {},
        listValidation = [],
        validation = [],
        multipleValues = false,
        predefinedValues = {
            values: [],
            enabled: false
        }
    } = params;

    const fieldId = initialFieldId ? camelCase(initialFieldId) : camelCase(label);

    return {
        id: fieldId,
        storageId: `${type}@${fieldId}`,
        fieldId,
        label,
        type,
        settings,
        listValidation,
        validation,
        multipleValues,
        predefinedValues
    };
};
