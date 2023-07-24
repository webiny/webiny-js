/**
 * For now, we're not doing actual encryption, just simple base64 encoding/decoding.
 * Potentially, we'll revisit this in the future and implement actual encryption.
 */
export declare const encrypt: <T = Record<string, any>>(rawObject: T) => string;
export declare const decrypt: <T = Record<string, any>>(encryptedString: string) => T;
