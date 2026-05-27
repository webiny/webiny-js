import { StorageTransform } from "../abstractions/StorageTransform.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { TextFieldTypes } from "~/features/modelBuilder/index.js";

class CompressedTextStorageTransformImpl implements StorageTransform.Interface<string, string> {
    public readonly fieldType = TextFieldTypes.COMPRESSED;

    public constructor(private readonly compressionHandler: CompressionHandler.Interface) {}

    public async fromStorage(
        params: StorageTransform.FromStorageParams<unknown, string>
    ): StorageTransform.FromStorageResponse<string> {
        const { value } = params;
        if (typeof value !== "string") {
            return value as string;
        } else if (!value.includes("compression")) {
            return value;
        }
        try {
            const parsed = JSON.parse(value);
            return await this.compressionHandler.decompress<string>(parsed);
        } catch {
            return value;
        }
    }

    public async toStorage(
        params: StorageTransform.ToStorageParams<unknown, string>
    ): StorageTransform.ToStorageResponse<string> {
        const { value } = params;
        if (typeof value !== "string") {
            return value as string;
        }

        try {
            return JSON.stringify(await this.compressionHandler.compress(value));
        } catch {
            return value;
        }
    }
}

export const CompressedTextStorageTransform = StorageTransform.createImplementation({
    implementation: CompressedTextStorageTransformImpl,
    dependencies: [CompressionHandler]
});
