/**
 * For now, we're not doing actual encryption, just simple base64 encoding/decoding.
 * Potentially, we'll revisit this in the future and implement actual encryption.
 */

const encrypt = rawObject => {
    try {
        return Buffer.from(JSON.stringify(rawObject), "utf-8").toString("base64");
    } catch {
        throw new Error("Could not encrypt given data.");
    }
};

const decrypt = encryptedString => {
    try {
        const decryptedString = Buffer.from(encryptedString, "base64").toString("utf-8");
        return JSON.parse(decryptedString);
    } catch {
        throw new Error(`Could not decrypt the given string (${encryptedString}).`);
    }
};

module.exports = { encrypt, decrypt };
