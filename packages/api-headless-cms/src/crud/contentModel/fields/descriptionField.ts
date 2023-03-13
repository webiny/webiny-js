import { CmsModelField } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";
import WebinyError from "@webiny/error";

export const getContentModelDescriptionFieldId = (
    fields: CmsModelField[],
    descriptionFieldId?: string | null
): string | null | undefined => {
    /**
     * If there are no fields defined, we will just set as null.
     */
    if (fields.length === 0) {
        return null;
    }
    /**
     * If description field is not defined, let us find possible one.
     */
    if (!descriptionFieldId) {
        const descriptionField = fields.find(field => {
            return getBaseFieldType(field) === "long-text" && !field.multipleValues;
        });
        return descriptionField?.fieldId || null;
    }
    const target = fields.find(
        field => field.fieldId === descriptionFieldId && getBaseFieldType(field) === "long-text"
    );
    if (!target) {
        throw new WebinyError(
            `Field selected for the description field does not exist in the model.`,
            "VALIDATION_ERROR",
            {
                fieldId: descriptionFieldId,
                fields
            }
        );
    }
    if (target.multipleValues) {
        throw new WebinyError(
            `Fields that accept multiple values cannot be used as the entry description.`,
            "ENTRY_TITLE_FIELD_TYPE",
            {
                storageId: target.storageId,
                fieldId: target.fieldId,
                type: target.type
            }
        );
    }

    return target.fieldId;
};
