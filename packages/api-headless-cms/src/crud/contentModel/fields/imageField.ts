import { CmsModelField } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";
import WebinyError from "@webiny/error";

export const getContentModelImageFieldId = (
    fields: CmsModelField[],
    imageFieldId?: string | null
): string | null | undefined => {
    /**
     * If there are no fields defined, we will just set as null.
     */
    if (fields.length === 0) {
        return null;
    }
    /**
     * If image field is not defined, let us find possible one.
     */
    if (!imageFieldId) {
        const imageField = fields.find(field => {
            return (
                getBaseFieldType(field) === "file" &&
                !field.multipleValues &&
                field.settings?.imagesOnly
            );
        });
        return imageField?.fieldId;
    }
    const target = fields.find(
        field =>
            field.fieldId === imageFieldId &&
            getBaseFieldType(field) === "file" &&
            field.settings?.imagesOnly
    );
    if (!target) {
        throw new WebinyError(
            `Field selected for the image field does not exist in the model.`,
            "VALIDATION_ERROR",
            {
                fieldId: imageFieldId,
                fields
            }
        );
    }
    if (target.multipleValues) {
        throw new WebinyError(
            `Fields that accept multiple values cannot be used as the entry image.`,
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
