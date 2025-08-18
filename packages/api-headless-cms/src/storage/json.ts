import { StorageTransformPlugin } from "~/plugins/StorageTransformPlugin";
import { CompressorPlugin } from "@webiny/api";
import { WebinyError } from "@webiny/error";

export const createJsonStorageTransform = (): StorageTransformPlugin => {
    return new StorageTransformPlugin({
        name: "headless-cms.storage-transform.json",
        fieldType: "json",
        fromStorage: async ({ field, value: storageValue, plugins }) => {
            if (!storageValue) {
                return storageValue;
            } else if (typeof storageValue !== "object") {
                throw new WebinyError(
                    `JSON value received in "fromStorage" function is not an object in field "${field.storageId}" - ${field.fieldId}.`
                );
            }

            let compressor: CompressorPlugin;

            try {
                compressor = plugins.oneByType<CompressorPlugin>(CompressorPlugin.type);
            } catch {
                return storageValue;
            }

            try {
                return await compressor.getCompressor().decompress(storageValue);
            } catch {
                return storageValue;
            }
        },
        toStorage: async ({ value, plugins }) => {
            let compressor: CompressorPlugin;

            try {
                compressor = plugins.oneByType<CompressorPlugin>(CompressorPlugin.type);
            } catch {
                return value;
            }
            try {
                return await compressor.getCompressor().compress(value);
            } catch {
                return value;
            }
        }
    });
};
