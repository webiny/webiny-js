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
