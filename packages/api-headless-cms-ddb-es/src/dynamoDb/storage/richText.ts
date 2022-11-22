import jsonpack from "jsonpack";
import WebinyError from "@webiny/error";
import { StorageTransformPlugin } from "@webiny/api-headless-cms";

export type OriginalValue = Record<string, any> | any[];

export interface StorageValue {
    compression: string;
    value: any;
}

/**
 * Remove when jsonpack gets PR with a fix merged
 * https://github.com/rgcl/jsonpack/pull/25/files
 * NOTE 2021-07-28: it seems PR is not going to be merged so keep this.
 */
// TODO @ts-refactor figure better type
const transformArray = (value: any) => {
    if (!value) {
        return value;
    }
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

export const createRichTextStorageTransformPlugin = () => {
    return new StorageTransformPlugin({
        fieldType: "rich-text",
        fromStorage: async ({ field, value: storageValue }) => {
            if (!storageValue) {
                return storageValue;
            } else if (typeof storageValue !== "object") {
                throw new WebinyError(
                    `RichText value received in "fromStorage" function is not an object in field "${field.storageId}".`
                );
            }
            /**
             * This is to circumvent a bug introduced with 5.8.0 storage operations.
             * Do not remove.
             */
            if (storageValue.hasOwnProperty("compression") === false) {
                return storageValue;
            }
            const { compression, value } = storageValue;
            if (!compression) {
                throw new WebinyError(
                    `Missing compression in "fromStorage" function in field "${
                        field.storageId
                    }": ${JSON.stringify(storageValue)}.`,
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
            try {
                return jsonpack.unpack(value);
            } catch (ex) {
                if (process.env.DEBUG !== "true") {
                    return null;
                }
                console.log("Error while decompressing rich-text.");
                console.log(ex.message);
                return null;
            }
        },
        toStorage: async ({ value }) => {
            /**
             * There is a possibility that we are trying to compress already compressed value.
             * Introduced a bug with 5.8.0 storage operations, so just return the value to correct it.
             */
            if (value && value.hasOwnProperty("compression") === true) {
                return value as any;
            }
            value = transformArray(value);

            let jsonValue: string | null = null;
            try {
                jsonValue = jsonpack.pack(value);
            } catch (ex) {
                if (process.env.DEBUG !== "true") {
                    return null;
                }
                console.log("Error while compressing rich-text.");
                console.log(ex.message);
            }
            return {
                compression: "jsonpack",
                value: jsonValue
            };
        }
    });
};
