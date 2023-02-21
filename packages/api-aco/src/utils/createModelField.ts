import { CmsModelField } from "@webiny/api-headless-cms/types";
import camelCase from "lodash/camelCase";

export interface CreateModelFieldParams
    extends Omit<CmsModelField, "id" | "storageId" | "fieldId"> {
    fieldId?: string;
    parent: string;
}

export const createModelField = (params: CreateModelFieldParams): CmsModelField => {
    const {
        label,
        fieldId: initialFieldId,
        type,
        parent,
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
    const id = `${camelCase(parent)}_${fieldId}`;

    return {
        id,
        storageId: fieldId,
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
