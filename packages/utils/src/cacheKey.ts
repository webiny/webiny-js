import crypto, { BinaryToTextEncoding } from "crypto";

export type ICacheKeyKeys = Record<string, any> | string | number;

export interface ICacheKeyOptions {
    algorithm?: CacheKeyAlgorithmType;
    encoding?: BinaryToTextEncoding;
}

export type CacheKeyAlgorithmType = "md5" | "sha1" | "sha224" | "sha256" | "sha384" | "sha512";

const getCacheKey = (input: ICacheKeyKeys): string => {
    if (typeof input === "string") {
        return input;
    } else if (typeof input === "number") {
        return `${input}`;
    }
    return JSON.stringify(input);
};

export const createCacheKey = (input: ICacheKeyKeys, options?: ICacheKeyOptions): string => {
    const key = getCacheKey(input);
    return crypto
        .createHash(options?.algorithm || "sha1")
        .update(key)
        .digest(options?.encoding || "hex");
};
