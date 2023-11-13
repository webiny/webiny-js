import crypto from "crypto";
import { ICacheKey, ICacheKeyKeys } from "./types";

const getCacheKey = (input: ICacheKeyKeys): string => {
    if (typeof input === "string") {
        return input;
    } else if (typeof input === "number") {
        return `${input}`;
    }
    return JSON.stringify(input);
};

const createHash = (input: ICacheKeyKeys): string => {
    const key = getCacheKey(input);
    const hash = crypto.createHash("sha1");
    hash.update(key);
    return hash.digest("hex");
};

class CacheKey implements ICacheKey {
    private readonly key: string;
    public readonly keys: ICacheKeyKeys;

    private constructor(keys: ICacheKeyKeys) {
        this.keys = keys;
        this.key = createHash(keys);
    }

    public static create(key: ICacheKeyKeys): ICacheKey {
        return new CacheKey(key);
    }

    public get(): string {
        return this.key;
    }
}

export const createCacheKey = (key: ICacheKeyKeys) => {
    return CacheKey.create(key);
};
