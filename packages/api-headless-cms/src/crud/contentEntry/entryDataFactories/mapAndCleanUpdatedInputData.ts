import WebinyError from "@webiny/error";
import { CmsModel } from "~/types";

/**
 * Cleans the update input entry data.
 */
export const mapAndCleanUpdatedInputData = (model: CmsModel, input: Record<string, any>) => {
    return model.fields.reduce<Record<string, any>>((acc, field) => {
        /**
         * This should never happen, but let's make it sure.
         * The fix would be for the user to add the fieldId on the field definition.
         */
        if (!field.fieldId) {
            throw new WebinyError("Field does not have an fieldId.", "MISSING_FIELD_ID", {
                field
            });
        }
        /**
         * We cannot set default value here because user might want to update only certain field values.
         */
        const value = input[field.fieldId];
        if (value === undefined) {
            return acc;
        }
        acc[field.fieldId] = value;
        return acc;
    }, {});
};
