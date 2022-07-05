/**
 * For now, we're not doing actual encryption, just simple base64 encoding/decoding.
 * Potentially, we'll revisit this in the future and implement actual encryption.
 */

export const encrypt = <T = Record<string, any>>(rawObject: T): string => {
    try {
        return Buffer.from(JSON.stringify(rawObject), "utf-8").toString("base64");
    } catch {
        throw new Error("Could not encrypt given data.");
    }
};

export const decrypt = <T = Record<string, any>>(encryptedString: string): T => {
    try {
        const decryptedString = Buffer.from(encryptedString, "base64").toString("utf-8");
        return JSON.parse(decryptedString) as T;
    } catch {
        throw new Error(`Could not decrypt the given string (${encryptedString}).`);
    }
};
