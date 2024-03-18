import { ICacheKey } from "./types";
import { createCacheKey as createCacheKeyValue, ICacheKeyKeys } from "@webiny/utils";

class CacheKey implements ICacheKey {
    private readonly key: string;
    public readonly keys: ICacheKeyKeys;

    private constructor(keys: ICacheKeyKeys) {
        this.keys = keys;
        this.key = createCacheKeyValue(keys, {
            algorithm: "sha1",
            encoding: "hex"
        });
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
