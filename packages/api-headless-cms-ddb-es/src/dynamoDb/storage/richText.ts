import WebinyError from "@webiny/error";
import { StorageTransformPlugin } from "@webiny/api-headless-cms";
import { CompressorPlugin } from "@webiny/api";

export const createRichTextStorageTransformPlugin = () => {
    const plugin = new StorageTransformPlugin({
        name: "headless-cms.storage-transform.rich-text.default",
        fieldType: "rich-text",
        fromStorage: async ({ field, value: storageValue, plugins }) => {
            if (!storageValue) {
                return storageValue;
            } else if (typeof storageValue !== "object") {
                throw new WebinyError(
                    `RichText value received in "fromStorage" function is not an object in field "${field.storageId}" - ${field.fieldId}.`
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
    plugin.name = `headless-cms.dynamodb.storageTransform.rich-text`;

    return plugin;
};
