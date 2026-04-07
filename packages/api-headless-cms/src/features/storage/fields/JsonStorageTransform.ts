import { StorageTransform } from "../abstractions/StorageTransform.js";
import { Compressor } from "@webiny/api";
import { WebinyError } from "@webiny/error";

class JsonStorageTransformImpl implements StorageTransform.Interface {
    public fieldType = "json";

    public async fromStorage({
        field,
        value: storageValue,
        plugins
    }: StorageTransform.FromStorageParams): StorageTransform.FromStorageResponse {
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
    }

    public async toStorage({
        value,
        plugins
    }: StorageTransform.ToStorageParams): StorageTransform.ToStorageResponse {
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
}

export const JsonStorageTransform = StorageTransform.createImplementation({
    implementation: JsonStorageTransformImpl,
    dependencies: []
});
