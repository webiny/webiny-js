import { StorageTransform } from "../abstractions/StorageTransform.js";
import { WebinyError } from "@webiny/error";
import { CompressionHandler } from "@webiny/utils/exports/api.js";

class JsonStorageTransformImpl implements StorageTransform.Interface {
    public fieldType = "json";

    public constructor(private readonly compressorHandler: CompressionHandler.Interface) {}

    public async fromStorage({
        field,
        value
    }: StorageTransform.FromStorageParams): StorageTransform.FromStorageResponse {
        if (!value) {
            return value;
        } else if (typeof value !== "object") {
            throw new WebinyError(
                `JSON value received in "fromStorage" function is not an object in field "${field.storageId}" - ${field.fieldId}.`
            );
        }

        return await this.compressorHandler.decompress(value);
    }

    public async toStorage({
        value
    }: StorageTransform.ToStorageParams): StorageTransform.ToStorageResponse {
        return await this.compressorHandler.compress(value);
    }
}

export const JsonStorageTransform = StorageTransform.createImplementation({
    implementation: JsonStorageTransformImpl,
    dependencies: [CompressionHandler]
});
