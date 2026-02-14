import camelCase from "lodash/camelCase.js";
import type { CmsModelField, CmsModelFieldValidation } from "~/types/index.js";

export interface CreateModelFieldParams extends Omit<
    CmsModelField,
    "id" | "storageId" | "fieldId" | "validation" | "listValidation"
> {
    id?: string;
    fieldId?: string;
    storageId?: string;
    validation?: CmsModelFieldValidation[];
    listValidation?: CmsModelFieldValidation[];
}

export const createModelField = (params: CreateModelFieldParams): CmsModelField => {
    // We are not just spreading `params` because we want to ensure
    // a default value is set for every property of the model field.
    const {
        id,
        label,
        fieldId: initialFieldId,
        storageId,
        type,
        tags = [],
        settings = {},
        listValidation = [],
        validation = [],
        multipleValues = false,
        predefinedValues = {
            values: [],
            enabled: false
        },
        help = null,
        placeholder = null,
        renderer = null
    } = params;

    // TODO: ideally, initialFieldId should also be passed through `camelCase` but currently this would break `wbyAco_location` field.
    // TODO: Once this legacy field is removed, we can enable camelCase on the initialFieldId.
    const fieldId = initialFieldId ? initialFieldId : camelCase(label);

    return {
        id: id ?? fieldId,
        storageId: storageId ?? `${type}@${id ?? fieldId}`,
        fieldId,
        label,
        type,
        settings,
        tags,
        listValidation,
        validation,
        multipleValues,
        predefinedValues,
        help,
        placeholder,
        renderer
    };
};
