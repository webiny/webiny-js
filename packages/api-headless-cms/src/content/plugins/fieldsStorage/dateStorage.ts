import {
    CmsContentModelDateTimeField,
    CmsModelFieldToStoragePlugin
} from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

export default (): CmsModelFieldToStoragePlugin => ({
    type: "cms-model-field-to-storage",
    name: "cms-model-field-to-storage-datetime",
    fieldType: "datetime",
    async fromStorage({ field, value }): Promise<Date | string> {
        const { type } = (field as CmsContentModelDateTimeField).settings;
        if (!value || type === "time" || type === "dateTimeWithTimezone") {
            return value;
        }
        try {
            return new Date(value);
        } catch {
            return value;
        }
    },
    async toStorage({ value, field }): Promise<string> {
        if (value instanceof Date) {
            return value.toISOString();
        } else if (typeof value === "string") {
            return value;
        }
        throw new WebinyError("Error converting value to a storage type.", "TO_STORAGE_ERROR", {
            value,
            fieldId: field.fieldId
        });
    }
});
