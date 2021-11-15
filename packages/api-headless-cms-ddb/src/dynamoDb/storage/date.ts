import WebinyError from "@webiny/error";
import {
    CmsModelDateTimeField,
    CmsModelFieldToStoragePlugin
} from "@webiny/api-headless-cms/types";

const excludeTypes = ["time", "dateTimeWithTimezone"];

export default (): CmsModelFieldToStoragePlugin<Date | string, string> => ({
    type: "cms-model-field-to-storage",
    name: "cms-model-field-to-storage-datetime",
    fieldType: "datetime",
    async fromStorage({ field, value }) {
        const { type } = (field as CmsModelDateTimeField).settings;
        if (!value || !type || excludeTypes.includes(type)) {
            return value;
        }
        try {
            return new Date(value);
        } catch {
            return value;
        }
    },
    async toStorage({ value, field }) {
        const { type } = (field as CmsModelDateTimeField).settings;
        if (!value || !type || excludeTypes.includes(type)) {
            if (value && (value as Date).toISOString) {
                return (value as Date).toISOString();
            }
            return value as string;
        }
        if ((value as any).toISOString) {
            return (value as Date).toISOString();
        } else if (typeof value === "string") {
            return value as string;
        }
        throw new WebinyError("Error converting value to a storage type.", "TO_STORAGE_ERROR", {
            value,
            fieldId: field.fieldId
        });
    }
});
