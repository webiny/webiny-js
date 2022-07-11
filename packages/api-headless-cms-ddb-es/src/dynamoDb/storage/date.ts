import WebinyError from "@webiny/error";
import { StorageTransformPlugin } from "@webiny/api-headless-cms";

const excludeTypes = ["time", "dateTimeWithTimezone"];

const plugin = new StorageTransformPlugin({
    fieldType: "datetime",
    fromStorage: async ({ value, field }) => {
        const { type } = field.settings || {};
        if (!value || !type || excludeTypes.includes(type)) {
            return value;
        }
        try {
            return new Date(value);
        } catch {
            console.log(`Could not transform from storage for field type`);
            return value;
        }
    },
    toStorage: async ({ value, field }) => {
        const { type } = field.settings || {};
        if (!value || !type || excludeTypes.includes(type)) {
            return value;
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

export default () => {
    return plugin;
};
