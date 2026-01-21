import WebinyError from "@webiny/error";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";

/**
 * Cleans the update input entry data.
 */
export const mapAndCleanUpdatedInputData = <TValues extends CmsEntryValues = CmsEntryValues>(
    model: CmsModel,
    input?: Partial<TValues>
) => {
    if (!input) {
        return {};
    }
    return model.fields.reduce<Partial<TValues>>((acc, field) => {
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
        const key = field.fieldId as keyof TValues;
        const value = input[key];
        if (value === undefined) {
            return acc;
        }
        acc[key] = value;
        return acc;
    }, {});
};
