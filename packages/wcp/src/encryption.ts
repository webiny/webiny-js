/**
 * For now, we're not doing actual encryption, just simple base64 encoding/decoding.
 * Potentially, we'll revisit this in the future and implement actual encryption.
 */

export const encrypt = (rawString: string) => {
    return Buffer.from(rawString, "utf-8").toString("base64");
};

export const decrypt = (base64String: string) => {
    return Buffer.from(base64String, "base64").toString("utf-8");
};
