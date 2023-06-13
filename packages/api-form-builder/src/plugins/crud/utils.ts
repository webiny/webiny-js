import { NotAuthorizedError } from "@webiny/api-security";
import { FbFormField } from "~/types";

export const sanitizeFormSubmissionData = (fields: FbFormField[], data: { [key: string]: any }) => {
    for (const FieldId in data) {
        const fieldData = fields.find(field => field.fieldId === FieldId) || null;

        if (fieldData?.options && fieldData?.type === "checkbox") {
            const optionLabels = fieldData.options
                .filter(option => data[FieldId].includes(option.value))
                ?.map(option => option.label);

            if (optionLabels?.length > 0) {
                data[`${FieldId}_label`] = optionLabels;
            } else {
                data[`${FieldId}_label`] = data[FieldId];
            }
        } else if (fieldData?.options && fieldData?.options?.length > 0) {
            const optionLabel = fieldData.options.find(
                option => option.value === data[FieldId]
            )?.label;

            if (optionLabel) {
                data[`${FieldId}_label`] = optionLabel;
            } else {
                data[`${FieldId}_label`] = data[FieldId];
            }
        }
    }

    return data;
};

/**
 * Converts deep submission meta object into flat object suitable for CSV.
 */
export const flattenSubmissionMeta = (
    obj: Record<string, any>,
    parent: string,
    res: Record<string, string> = {}
) => {
    for (const key in obj) {
        const propName = parent ? parent + "_" + key : key;
        if (typeof obj[key] == "object") {
            flattenSubmissionMeta(obj[key], propName, res);
        } else {
            res[propName] = obj[key];
        }
    }
    return res;
};
