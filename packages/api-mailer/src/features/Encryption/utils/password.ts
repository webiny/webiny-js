import crypto from "node:crypto";
import WebinyError from "@webiny/error";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

interface Params {
    value?: string | null;
    secret?: string | null;
}

export const decrypt = (params: Params): string => {
    const { value, secret } = params;
    if (!secret) {
        throw new WebinyError(`Cannot call decrypt without passing the secret.`);
    }
    if (!value) {
        return "";
    }
    try {
        const data = Buffer.from(value, "base64");

        const iv = data.subarray(0, 12);
        const authTag = data.subarray(12, 28);
        const encrypted = data.subarray(28);

        const key = crypto.scryptSync(secret, "salt", 32);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

        return decrypted.toString("utf8");
    } catch {
        console.log(`Could not decrypt given encrypted password.`);
    }
    return "";
};

export const encrypt = (params: Params): string => {
    const { value, secret } = params;
    if (!secret) {
        throw new WebinyError(`Cannot call decrypt without passing the secret.`);
    }
    if (!value) {
        return "";
    }

    try {
        const key = crypto.scryptSync(secret, "salt", KEY_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return Buffer.concat([iv, authTag, encrypted]).toString("base64");
    } catch {
        console.log(`Could not encrypt given password.`);
    }
    return "";
};
