import WebinyError from "@webiny/error";
import type { CmsModelField } from "~/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { StorageTransform } from "../abstractions/StorageTransform.js";

const excludeTypes = ["time", "dateTimeWithTimezone"];

const convertFromStorage = (value: unknown): Date | unknown => {
    if (!value) {
        return value === null ? null : undefined;
    }
    try {
        const output = new Date(value as string);
        if (isNaN(output.getTime())) {
            if (process.env.DEBUG !== "true") {
                return null;
            }
            console.warn(`Could not transform "${value}" to date.`);
            return null;
        }
        return output;
    } catch {
        if (process.env.DEBUG !== "true") {
            return null;
        }
        console.warn(`Could not transform "${value}" from storage for date field type.`);
        return null;
    }
};

const convertValueToStorage = (field: CmsModelField, value: Date | string | unknown): string => {
    if (value instanceof Date || (value as GenericRecord)?.toISOString) {
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


class DateStorageTransformImpl implements StorageTransform.Interface {
    public readonly fieldType = "datetime";

    public async toStorage(
        params: StorageTransform.ToStorageParams
    ): StorageTransform.ToStorageResponse {
        const { value, field } = params;
        const { type } = field.settings || {};
        if (!value || !type || excludeTypes.includes(type)) {
            return value;
        }
        if (field.list) {
            const list = value as (string | Date | null | undefined)[];
            const results: string[] = [];
            for (const input of list) {
                if (!input) {
                    continue;
                }
                const output = convertValueToStorage(field, input);
                if (!output) {
                    continue;
                }
                results.push(output);
            }
            return results;
        }
        return convertValueToStorage(field, value);
    }

    public async fromStorage(
        params: StorageTransform.FromStorageParams
    ): StorageTransform.FromStorageResponse {
        const { value, field } = params;
        const { type } = field.settings || {};
        if (!value || !type || excludeTypes.includes(type)) {
            return value;
        } else if (field.list) {
            if (!Array.isArray(value)) {
                return [];
            }
            const list = value as unknown[];
            const results: (Date | unknown)[] = [];
            for (const input of list) {
                if (input instanceof Date) {
                    if (isNaN(input.getTime())) {
                        continue;
                    }
                    results.push(input);
                    continue;
                } else if (
                    !input ||
                    (typeof input === "object" && Object.keys(input).length === 0)
                ) {
                    continue;
                }
                const output = convertFromStorage(input);
                if (!output) {
                    continue;
                }
                results.push(output);
            }
            return results;
        }
        return convertFromStorage(value);
    }
}


export const DateStorageTransform = StorageTransform.createImplementation({
    implementation: DateStorageTransformImpl,
    dependencies: [],
})
