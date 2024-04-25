import camelCase from "lodash/camelCase";
import { CmsModelField } from "~/types";

export interface CreateModelFieldParams
    extends Omit<CmsModelField, "id" | "storageId" | "fieldId"> {
    id?: string;
    fieldId?: string;
    storageId?: string;
}

export const createModelField = (params: CreateModelFieldParams): CmsModelField => {
    const {
        id,
        label,
        fieldId: initialFieldId,
        storageId,
        type,
        tags,
        settings = {},
        listValidation = [],
        validation = [],
        multipleValues = false,
        predefinedValues = {
            values: [],
            enabled: false
        },
        helpText,
        placeholderText,
        renderer
    } = params;

    const fieldId = initialFieldId ? camelCase(initialFieldId) : camelCase(label);

    return {
        id: id ?? fieldId,
        storageId: storageId ?? `${type}@${fieldId}`,
        fieldId,
        label,
        type,
        settings,
        tags,
        listValidation,
        validation,
        multipleValues,
        predefinedValues,
        helpText,
        placeholderText,
        renderer
    };
};
