import { CmsModelField } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";
import { getApplicableFieldById } from "~/crud/contentModel/fields/getApplicableFieldById";

const defaultTitleFieldId = "id";

const isFieldApplicable = (field: CmsModelField) => {
    return getBaseFieldType(field) === "text" && !field.multipleValues;
};

/**
 * Try finding the requested field, and return its `fieldId`.
 * If not defined, or not applicable, fall back to the first applicable field.
 */
export const getContentModelTitleFieldId = (
    fields: CmsModelField[],
    titleFieldId?: string | null
) => {
    if (fields.length === 0) {
        return defaultTitleFieldId;
    }

    const target = getApplicableFieldById(fields, titleFieldId, isFieldApplicable);

    if (target) {
        return target.fieldId;
    }

    const textField = fields.find(isFieldApplicable);
    return textField ? textField.fieldId : defaultTitleFieldId;
};
