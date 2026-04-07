import { StorageTransform } from "../abstractions/StorageTransform.js";
import { WebinyError } from "@webiny/error";
import { CompressionHandler } from "@webiny/utils/exports/api.js";

interface StorageValue {
    compression: string;
    value: string;
    isArray?: boolean;
}

class LongTextStorageTransformImpl implements StorageTransform.Interface<string | string[], StorageValue> {
    public readonly fieldType = "long-text";

    public constructor(private readonly compressionHandler: CompressionHandler.Interface) {}

    public async fromStorage({
        field,
        value: storageValue
    }: StorageTransform.FromStorageParams<string | string[], StorageValue>): StorageTransform.FromStorageResponse<string | string[]> {
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

        try {
            const sv = storageValue as unknown as StorageValue;
            const result = await this.compressionHandler.decompress<string>(storageValue);
            if (!sv.isArray) {
                return result;
            }
            return JSON.parse(result);
        } catch (ex) {
            console.log("Error while transforming long-text.");
            console.log(ex.message);
            return "";
        }
    }

    public async toStorage({
        value: initialValue
    }: StorageTransform.ToStorageParams<string | string[], StorageValue>): StorageTransform.ToStorageResponse<StorageValue> {
        if (initialValue && (initialValue as unknown as StorageValue).compression) {
            return initialValue as unknown as StorageValue;
        }
        const isArray = Array.isArray(initialValue);
        const value = isArray ? JSON.stringify(initialValue) : initialValue;
        const compressed = await this.compressionHandler.compress(value);

        if (!isArray) {
            return compressed as unknown as StorageValue;
        }
        return { ...compressed, isArray } as unknown as StorageValue;
    }
}

export const LongTextStorageTransform = StorageTransform.createImplementation({
    implementation: LongTextStorageTransformImpl,
    dependencies: [CompressionHandler]
});
