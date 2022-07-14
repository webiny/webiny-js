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
    value: any;
}

const plugin = new StorageTransformPlugin<string, StorageValue>({
    fieldType: "long-text",
    fromStorage: async ({ field, value: storageValue }) => {
        const typeOf = typeof storageValue;
        if (!storageValue || typeOf === "string" || typeOf === "number") {
            return storageValue as any;
        } else if (typeof storageValue !== "object") {
            throw new WebinyError(
                `LongText value received in "fromStorage" function is not an object in field "${field.fieldId}".`
            );
        }
        const { compression, value } = storageValue;
        /**
         * Check if possibly undefined, null, empty...
         */
        if (!compression) {
            throw new WebinyError(
                `Missing compression in "fromStorage" function in field "${
                    field.fieldId
                }": ${JSON.stringify(storageValue)}.`,
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
            return buf.toString(FROM_STORAGE_ENCODING);
        } catch (ex) {
            if (process.env.DEBUG !== "true") {
                return null;
            }
            console.log("Error while decompressing long-text.");
            console.log(ex.message);
            return null;
        }
    },
    toStorage: async ({ value }) => {
        const compressedValue = await gzip(value);

        return {
            compression: GZIP,
            value: compressedValue.toString(TO_STORAGE_ENCODING)
        };
    }
});

export default () => {
    return plugin;
};
