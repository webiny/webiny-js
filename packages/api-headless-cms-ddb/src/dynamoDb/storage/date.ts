import WebinyError from "@webiny/error";
import {
    CmsContentModelDateTimeField,
    CmsModelFieldToStoragePlugin
} from "@webiny/api-headless-cms/types";

const excludeTypes = ["time", "dateTimeWithTimezone"];

function formatValue(fieldPath: string, value: any) {
    return { values: { [fieldPath]: value } };
}

export default (): CmsModelFieldToStoragePlugin<Date | string, string> => ({
    type: "cms-model-field-to-storage",
    name: "cms-model-field-to-storage-datetime",
    fieldType: "datetime",
    async fromStorage({ field, fieldPath, getValue }) {
        const { type } = (field as CmsContentModelDateTimeField).settings;
        const value = getValue(fieldPath);
        if (!value || !type || excludeTypes.includes(type)) {
            return formatValue(fieldPath, value);
        }

        try {
            return formatValue(fieldPath, new Date(value));
        } catch {
            return formatValue(fieldPath, value);
        }
    },
    async toStorage({ field, fieldPath, getValue }) {
        const value = getValue(fieldPath);
        const { type } = (field as CmsContentModelDateTimeField).settings;
        if (!value || !type || excludeTypes.includes(type)) {
            if (value && (value as Date).toISOString) {
                return formatValue(fieldPath, (value as Date).toISOString());
            }
            return formatValue(fieldPath, value);
        }
        if ((value as any).toISOString) {
            return formatValue(fieldPath, (value as Date).toISOString());
        } else if (typeof value === "string") {
            return { values: { [fieldPath]: value} };
        }
        throw new WebinyError("Error converting value to a storage type.", "TO_STORAGE_ERROR", {
            value,
            fieldId: field.fieldId,
            fieldPath
        });
    }
});
