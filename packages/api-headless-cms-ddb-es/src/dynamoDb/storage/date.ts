/**
 * File is @internal
 */
import WebinyError from "@webiny/error";
import { StorageTransformPlugin } from "@webiny/api-headless-cms";
import { CmsModelField } from "@webiny/api-headless-cms/types";

type PartialCmsModelField = Pick<CmsModelField, "fieldId" | "storageId" | "multipleValues">;

const excludeTypes = ["time", "dateTimeWithTimezone"];

const convertFromStorage = (field: PartialCmsModelField, value: string | string[]) => {
    try {
        if (field.multipleValues) {
            return ((value as string[]) || [])
                .filter(v => !!v)
                .map((v: string) => {
                    return new Date(v);
                });
        }
        return new Date(value as string);
    } catch {
        console.log(`Could not transform from storage for field type`);
        return value;
    }
};

const convertValueToStorage = (field: PartialCmsModelField, value: any): any => {
    if ((value as any).toISOString) {
        return (value as Date).toISOString();
    } else if (typeof value === "string") {
        return value as string;
    }
    throw new WebinyError("Error converting value to a storage type.", "TO_STORAGE_ERROR", {
        value: value,
        fieldId: field.fieldId,
        storageId: field.storageId
    });
};

export const createDateStorageTransformPlugin = () => {
    const plugin = new StorageTransformPlugin({
        fieldType: "datetime",
        fromStorage: async ({ value, field }) => {
            const { type } = field.settings || {};
            if (!value || !type || excludeTypes.includes(type)) {
                return value;
            }
            return convertFromStorage(field, value);
        },
        toStorage: async ({ value, field }) => {
            const { type } = field.settings || {};
            if (!value || !type || excludeTypes.includes(type)) {
                return value;
            }
            if (field.multipleValues) {
                const multipleValues = value as (string | Date | null | undefined)[];
                return (multipleValues || [])
                    .filter(v => !!v)
                    .map(v => {
                        return convertValueToStorage(field, v);
                    });
            }
            return convertValueToStorage(field, value);
        }
    });
    plugin.name = `headless-cms.dynamodb.storageTransform.date`;

    return plugin;
};
