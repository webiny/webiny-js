import { StorageTransform } from "../abstractions/StorageTransform.js";
import { WebinyError } from "@webiny/error";
import { CompressionHandler } from "@webiny/utils/exports/api.js";

class RichTextStorageTransformImpl implements StorageTransform.Interface {
    public readonly fieldType = "rich-text";

    public constructor(private readonly compressionHandler: CompressionHandler.Interface) {}

    public async fromStorage({
        field,
        value: storageValue
    }: StorageTransform.FromStorageParams): StorageTransform.FromStorageResponse {
        if (!storageValue) {
            return storageValue;
        } else if (typeof storageValue !== "object") {
            throw new WebinyError(
                `RichText value received in "fromStorage" function is not an object in field "${field.storageId}" - ${field.fieldId}.`
            );
        }

        try {
            return await this.compressionHandler.decompress(storageValue);
        } catch {
            return storageValue;
        }
    }

    public async toStorage({
        value
    }: StorageTransform.ToStorageParams): StorageTransform.ToStorageResponse {
        try {
            return await this.compressionHandler.compress(value);
        } catch {
            return value;
        }
    }
}

export const RichTextStorageTransform = StorageTransform.createImplementation({
    implementation: RichTextStorageTransformImpl,
    dependencies: [CompressionHandler]
});
