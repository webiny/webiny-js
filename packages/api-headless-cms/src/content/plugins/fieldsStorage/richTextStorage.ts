import { CmsModelFieldToStoragePlugin } from "../../../types";
import jsonpack from "jsonpack";
import WebinyError from "@webiny/error";

interface StoragePackedValue {
    compression?: string;
    value: any;
}
export default (): CmsModelFieldToStoragePlugin => {
    const cache = new Map();

    return {
        type: "cms-model-field-to-storage",
        name: "cms-model-field-to-storage-rich-text",
        fieldType: "rich-text",
        async fromStorage({ model, entry, field, value }): Promise<any> {
            const cacheKey = [model.modelId, entry.id, entry.savedOn, field.fieldId].join(".");

            if (cache.has(cacheKey)) {
                return cache.get(cacheKey);
            }

            if (!value) {
                return value;
            } else if (typeof value !== "object") {
                throw new WebinyError(
                    `Value received in "fromStorage" function is not an object in field "${field.fieldId}".`
                );
            } else if (!value.compression) {
                throw new WebinyError(
                    `Missing compression in "fromStorage" function in field "${field.fieldId}".`
                );
            }
            if (value.compression !== "jsonpack") {
                throw new WebinyError(
                    `This plugin cannot transform something not packed with "jsonpack".`
                );
            }

            cache.set(cacheKey, jsonpack.unpack(value.value));

            return cache.get(cacheKey);
        },
        async toStorage({ value }): Promise<StoragePackedValue> {
            return {
                compression: "jsonpack",
                value: jsonpack.pack(value || {})
            };
        }
    };
};
