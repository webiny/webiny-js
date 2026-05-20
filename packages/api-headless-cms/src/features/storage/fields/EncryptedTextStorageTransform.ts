import { StorageTransform } from "../abstractions/StorageTransform.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { TextFieldTypes } from "~/features/modelBuilder/index.js";

class EncryptedTextStorageTransformImpl implements StorageTransform.Interface<string, string> {
    public readonly fieldType = TextFieldTypes.ENCRYPTED;

    public constructor(private readonly encryption: Encryption.Interface) {}

    public async fromStorage(
        params: StorageTransform.FromStorageParams<unknown, string>
    ): StorageTransform.FromStorageResponse<string> {
        const { value } = params;
        if (!value || typeof value !== "string" || value.length === 0) {
            return value as string;
        }
        try {
            return await this.encryption.decrypt(value);
        } catch {
            return value;
        }
    }

    public async toStorage(
        params: StorageTransform.ToStorageParams<unknown, string>
    ): StorageTransform.ToStorageResponse<string> {
        const { value } = params;
        if (!value || typeof value !== "string" || value.length === 0) {
            return value as string;
        }

        try {
            return await this.encryption.encrypt(value);
        } catch {
            return value;
        }
    }
}

export const EncryptedTextStorageTransform = StorageTransform.createImplementation({
    implementation: EncryptedTextStorageTransformImpl,
    dependencies: [Encryption]
});
