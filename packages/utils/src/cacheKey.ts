import { sha256 } from "@noble/hashes/sha2";
import { utf8ToBytes, bytesToHex } from "@noble/hashes/utils";

export type ICacheKeyKeys = Record<string, any> | string | number;

const getCacheKey = (input: ICacheKeyKeys): string => {
    if (typeof input === "string") {
        return input;
    } else if (typeof input === "number") {
        return `${input}`;
    }
    return JSON.stringify(input);
};

export const createCacheKey = (input: ICacheKeyKeys): string => {
    const key = getCacheKey(input);

    const hash = sha256(utf8ToBytes(key));

    return bytesToHex(hash);
};
