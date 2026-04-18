import crypto from "node:crypto";
import { createImplementation } from "@webiny/feature/api";
import { Encryption as EncryptionAbstraction } from "./abstractions.js";
import { BuildParams } from "../buildParams/abstractions.js";

const DEFAULT_ALGORITHM = "aes-256-gcm";

function keyLengthForAlgorithm(algorithm: string): number {
    // Parse key size in bits from algorithm name (e.g. "aes-256-gcm" → 32 bytes).
    const bits = parseInt(algorithm.split("-")[1]);
    if (isNaN(bits)) {
        throw new Error(`Cannot determine key length from algorithm "${algorithm}".`);
    }
    return bits / 8;
}

export class EncryptionImpl implements EncryptionAbstraction.Interface {
    private key: Buffer;
    private algorithm: string;

    constructor(buildParams: BuildParams.Interface) {
        const passphrase = buildParams.get<string>("EncryptionPassphrase");
        if (!passphrase) {
            throw new Error(
                'Encryption passphrase is not configured. Set it via <Infra.Encryption passphrase="..." /> in webiny.config.tsx.'
            );
        }

        // Salt is optional. It ensures two projects using the same passphrase derive different keys,
        // but since passphrases should be unique per project anyway, it's extra insurance rather than a necessity.
        const salt = buildParams.get<string>("EncryptionSalt") ?? "";

        this.algorithm = buildParams.get<string>("EncryptionAlgorithm") ?? DEFAULT_ALGORITHM;
        const keyLength = keyLengthForAlgorithm(this.algorithm);
        this.key = crypto.scryptSync(passphrase, salt, keyLength);
    }

    encrypt(value: string): string {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
        const authTag = (cipher as crypto.CipherGCM).getAuthTag();
        return Buffer.concat([iv, authTag, encrypted]).toString("base64");
    }

    decrypt(value: string): string {
        const data = Buffer.from(value, "base64");
        const iv = data.subarray(0, 12);
        const authTag = data.subarray(12, 28);
        const ciphertext = data.subarray(28);
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        (decipher as crypto.DecipherGCM).setAuthTag(authTag);
        return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    }
}

export const Encryption = createImplementation({
    abstraction: EncryptionAbstraction,
    implementation: EncryptionImpl,
    dependencies: [BuildParams]
});
