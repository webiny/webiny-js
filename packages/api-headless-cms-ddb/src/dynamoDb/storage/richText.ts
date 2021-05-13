import jsonpack from "jsonpack";
import WebinyError from "@webiny/error";
import {
    CmsContentEntry,
    CmsContentModel,
    CmsContentModelField,
    CmsModelFieldToStoragePlugin
} from "@webiny/api-headless-cms/types";

export type OriginalValue = Record<string, any> | any[];
export interface StorageValue {
    compression: string;
    value: any;
}

interface CreateCacheKeyArgs {
    model: CmsContentModel;
    entry: CmsContentEntry;
    field: CmsContentModelField;
}
const createCacheKey = ({ model, entry, field }: CreateCacheKeyArgs): string => {
    return [model.modelId, entry.id, entry.savedOn, field.fieldId].join(".");
};
/**
 * Remove when jsonpack gets PR with a fix merged
 * https://github.com/rgcl/jsonpack/pull/25/files
 */
const transformArray = (value: Record<string, any> | any[]) => {
    let isArray = Array.isArray(value);
    const shouldBeArray = value instanceof Array === false && isArray;
    if (shouldBeArray) {
        value = Array.from(value as any);
        isArray = true;
    }
    if (typeof value === "object" || isArray) {
        for (const k in value) {
            value[k] = transformArray(value[k]);
        }
    }
    return value;
};

export default (): CmsModelFieldToStoragePlugin<OriginalValue, StorageValue> => {
    const cache = new Map<string, OriginalValue>();
    return {
        type: "cms-model-field-to-storage",
        name: "cms-model-field-to-storage-rich-text",
        fieldType: "rich-text",
        async fromStorage({ model, entry, field, value: storageValue }) {
            const cacheKey = createCacheKey({
                model,
                field,
                entry
            });

            if (cache.has(cacheKey)) {
                return cache.get(cacheKey);
            }

            if (!storageValue) {
                return storageValue;
            } else if (typeof storageValue !== "object") {
                throw new WebinyError(
                    `Value received in "fromStorage" function is not an object in field "${field.fieldId}".`
                );
            }
            const { compression, value } = storageValue;
            if (!compression) {
                throw new WebinyError(
                    `Missing compression in "fromStorage" function in field "${field.fieldId}".`
                );
            }
            if (compression !== "jsonpack") {
                throw new WebinyError(
                    `This plugin cannot transform something not packed with "jsonpack".`
                );
            }

            const unpacked = jsonpack.unpack(value);

            cache.set(cacheKey, unpacked);

            return unpacked;
        },
        async toStorage({ model, field, entry, value }) {
            const cacheKey = createCacheKey({
                model,
                field,
                entry
            });
            value = transformArray(value);
            const packed = jsonpack.pack(value);
            cache.set(cacheKey, value);
            return {
                compression: "jsonpack",
                value: packed
            };
        }
    };
};
