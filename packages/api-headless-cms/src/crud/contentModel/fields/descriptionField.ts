import { CmsModelField } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";
import { getApplicableFieldById } from "./getApplicableFieldById";

const isFieldApplicable = (field: CmsModelField) => {
    return getBaseFieldType(field) === "long-text" && !field.multipleValues;
};

/**
 * Try finding the requested field, and return its `fieldId`.
 * If not defined, or not applicable, fall back to the first applicable field.
 */
export const getContentModelDescriptionFieldId = (
    fields: CmsModelField[],
    descriptionFieldId?: string | null
) => {
    if (fields.length === 0) {
        return null;
    }

    const target = getApplicableFieldById(fields, descriptionFieldId, isFieldApplicable);

    if (target) {
        return target.fieldId;
    }

    const descriptionField = fields.find(isFieldApplicable);
    return descriptionField ? descriptionField.fieldId : null;
};
