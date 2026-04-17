import crypto from "crypto";
import { createImplementation } from "@webiny/feature/api";
import { Encryption as EncryptionAbstraction } from "./abstractions.js";
import { BuildParams } from "../buildParams/abstractions.js";

export class EncryptionImpl implements EncryptionAbstraction.Interface {
    private key: Buffer;

    constructor(buildParams: BuildParams.Interface) {
        const passphrase = buildParams.get<string>("EncryptionKey");
        if (!passphrase) {
            throw new Error(
                'Encryption key is not configured. Set it via <Infra.Encryption.Key value="..." /> in webiny.config.tsx.'
            );
        }
        this.key = crypto.createHash("sha256").update(passphrase).digest();
    }

    encrypt(value: string): string {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);
        const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return Buffer.concat([iv, authTag, encrypted]).toString("base64");
    }

    decrypt(value: string): string {
        const data = Buffer.from(value, "base64");
        const iv = data.subarray(0, 12);
        const authTag = data.subarray(12, 28);
        const ciphertext = data.subarray(28);
        const decipher = crypto.createDecipheriv("aes-256-gcm", this.key, iv);
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    }
}

export const Encryption = createImplementation({
    abstraction: EncryptionAbstraction,
    implementation: EncryptionImpl,
    dependencies: [BuildParams]
});
