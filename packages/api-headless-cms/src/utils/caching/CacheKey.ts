import crypto from "crypto";
import { ICacheKey } from "./types";

export type CacheKeyInput = Record<string, any> | string | number;

const getCacheKey = (input: CacheKeyInput): string => {
    if (typeof input === "string") {
        return input;
    } else if (typeof input === "number") {
        return `${input}`;
    }
    return JSON.stringify(input);
};

const createHash = (input: CacheKeyInput): string => {
    const key = getCacheKey(input);
    const hash = crypto.createHash("sha1");
    hash.update(key);
    return hash.digest("hex");
};

class CacheKey implements ICacheKey {
    private readonly _key: string;

    private constructor(key: CacheKeyInput) {
        this._key = createHash(key);
    }

    public static create(key: CacheKeyInput): ICacheKey {
        return new CacheKey(key);
    }

    public get(): string {
        return this._key;
    }
}

export const createCacheKey = (key: CacheKeyInput) => {
    return CacheKey.create(key);
};
