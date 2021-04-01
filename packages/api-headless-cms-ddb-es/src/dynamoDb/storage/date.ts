import WebinyError from "@webiny/error";
import {
    CmsContentModelDateTimeField,
    CmsModelFieldToStoragePlugin
} from "@webiny/api-headless-cms/types";

const excludeTypes = ["time", "dateTimeWithTimezone"];

export default (): CmsModelFieldToStoragePlugin => ({
    type: "cms-model-field-to-storage",
    name: "cms-model-field-to-storage-datetime",
    fieldType: "datetime",
    async fromStorage({ field, value }): Promise<Date | string> {
        const { type } = (field as CmsContentModelDateTimeField).settings;
        if (!value || !type || excludeTypes.includes(type) || typeof value !== "string") {
            return value;
        }
        try {
            return new Date(value);
        } catch {
            return value;
        }
    },
    async toStorage({ value, field }): Promise<string> {
        const { type } = (field as CmsContentModelDateTimeField).settings;
        if (!value || !type || excludeTypes.includes(type)) {
            return value;
        }
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
