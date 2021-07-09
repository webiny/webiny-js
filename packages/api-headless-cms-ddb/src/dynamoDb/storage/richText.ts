import jsonpack from "jsonpack";
import WebinyError from "@webiny/error";
import {
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
    field: CmsContentModelField;
    fieldPath: string;
}
const createCacheKey = ({ model, field, fieldPath }: CreateCacheKeyArgs): string => {
    return [model.modelId, field.id, fieldPath].join(".");
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

function formatValue(fieldPath: string, value: any) {
    return { values: { [fieldPath]: value } };
}

export default (): CmsModelFieldToStoragePlugin<OriginalValue, StorageValue> => {
    const cache = new Map<string, OriginalValue>();
    return {
        type: "cms-model-field-to-storage",
        name: "cms-model-field-to-storage-rich-text",
        fieldType: "rich-text",
        async fromStorage({ model, field, fieldPath, getValue }) {
            const cacheKey = createCacheKey({ model, field, fieldPath });
            const storageValue = getValue(fieldPath);

            if (cache.has(cacheKey)) {
                return formatValue(fieldPath, cache.get(cacheKey));
            }

            if (!storageValue) {
                return formatValue(fieldPath, storageValue);
            } else if (typeof storageValue !== "object") {
                throw new WebinyError(
                    `Value received in "fromStorage" function is not an object in field "${field.fieldId}".`
                );
            }
            /**
             * This is to circumvent a bug introduced with 5.8.0 storage operations.
             * TODO: remove with 5.9.0 upgrade
             */
            if (storageValue.hasOwnProperty("compression") === false) {
                return formatValue(fieldPath, storageValue);
            }
            const { compression, value } = storageValue;
            if (!compression) {
                throw new WebinyError(
                    `Missing compression in "fromStorage" function in field "${field.fieldId}".`,
                    "MISSING_COMPRESSION",
                    {
                        value: storageValue
                    }
                );
            }
            if (compression !== "jsonpack") {
                throw new WebinyError(
                    `This plugin cannot transform something not packed with "jsonpack".`,
                    "WRONG_COMPRESSION",
                    {
                        compression
                    }
                );
            }

            const unpacked = jsonpack.unpack(value);

            cache.set(cacheKey, unpacked);

            return formatValue(fieldPath, unpacked);
        },
        async toStorage({ model, field, fieldPath, getValue }) {
            let value = getValue(fieldPath);
            /**
             * There is a possibility that we are trying to compress already compressed value.
             * Introduced a bug with 5.8.0 storage operations, so just return the value to correct it.
             * TODO: remove with 5.9.0 upgrade.
             */
            if (value && value.hasOwnProperty("compression") === true) {
                return formatValue(fieldPath, value);
            }
            const cacheKey = createCacheKey({ model, field, fieldPath });
            value = transformArray(value);
            const packed = jsonpack.pack(value);
            cache.set(cacheKey, value);
            
            return formatValue(fieldPath, {
                compression: "jsonpack",
                value: packed
            });
        }
    };
};
