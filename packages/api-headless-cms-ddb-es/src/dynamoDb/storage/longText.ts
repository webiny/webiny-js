/**
 * File is @internal
 */

import WebinyError from "@webiny/error";
import { compress as gzip, decompress as ungzip } from "@webiny/utils/compression/gzip";
import { StorageTransformPlugin } from "@webiny/api-headless-cms";

const GZIP = "gzip";
const TO_STORAGE_ENCODING = "base64";
const FROM_STORAGE_ENCODING = "utf8";

const convertToBuffer = (value: string | Buffer): Buffer => {
    if (typeof value === "string") {
        return Buffer.from(value, TO_STORAGE_ENCODING);
    }
    return value;
};

export interface StorageValue {
    compression: string;
    value: string;
    isArray?: boolean;
}

export const createLongTextStorageTransformPlugin = () => {
    const plugin = new StorageTransformPlugin<string | string[], StorageValue>({
        fieldType: "long-text",
        fromStorage: async ({ field, value: storageValue }) => {
            const typeOf = typeof storageValue;
            if (
                !storageValue ||
                typeOf === "string" ||
                typeOf === "number" ||
                Array.isArray(storageValue) === true
            ) {
                return storageValue as unknown as string | string[];
            } else if (typeOf !== "object") {
                throw new WebinyError(
                    `LongText value received in "fromStorage" function is not an object in field "${field.storageId}" - ${field.fieldId}.`
                );
            }
            const { compression, value, isArray } = storageValue;
            /**
             * Check if possibly undefined, null, empty...
             */
            if (!compression) {
                throw new WebinyError(
                    `Missing compression in "fromStorage" function in field "${
                        field.storageId
                    }" - ${field.fieldId}.": ${JSON.stringify(storageValue)}.`,
                    "MISSING_COMPRESSION",
                    {
                        value: storageValue
                    }
                );
            } else if (compression !== GZIP) {
                throw new WebinyError(
                    `This plugin cannot transform something not compressed with "GZIP".`,
                    "WRONG_COMPRESSION",
                    {
                        compression
                    }
                );
            }
            try {
                const buf = await ungzip(convertToBuffer(value));
                const result = buf.toString(FROM_STORAGE_ENCODING);
                if (!isArray) {
                    return result;
                }
                return JSON.parse(result);
            } catch (ex) {
                console.log("Error while transforming long-text.");
                console.log(ex.message);
                return "";
            }
        },
        toStorage: async ({ value: initialValue }) => {
            /**
             * There is a possibility that we are trying to compress already compressed value.
             */
            if (initialValue && initialValue.hasOwnProperty("compression") === true) {
                return initialValue as unknown as StorageValue;
            }
            const isArray = Array.isArray(initialValue);
            const value = isArray ? JSON.stringify(initialValue) : initialValue;
            const compressedValue = await gzip(value);

            const result: StorageValue = {
                compression: GZIP,
                value: compressedValue.toString(TO_STORAGE_ENCODING)
            };
            if (!isArray) {
                return result;
            }
            result.isArray = isArray;
            return result;
        }
    });
    plugin.name = plugin.name = `headless-cms.dynamodb.storageTransform.long-text`;

    return plugin;
};
