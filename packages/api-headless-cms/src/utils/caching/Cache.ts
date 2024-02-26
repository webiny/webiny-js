import { ICache, ICacheKey } from "./types";

class Cache<T> implements ICache {
    private _cache: Map<string, T> = new Map();

    protected constructor() {
        // Prevent direct instantiation.
    }

    public static create<R>() {
        return new this<R>();
    }

    public get(cacheKey: ICacheKey): T | null {
        const key = cacheKey.get();
        const value = this._cache.get(key);
        return value || null;
    }

    public set(cacheKey: ICacheKey, value: T): T {
        const key = cacheKey.get();
        this._cache.set(key, value);
        return value;
    }

    public getOrSet(cacheKey: ICacheKey, cb: () => T): T {
        const existing = this.get(cacheKey);
        if (existing) {
            return existing;
        }
        const value = cb();
        return this.set(cacheKey, value);
    }

    public clear(cacheKey?: ICacheKey | ICacheKey[]) {
        if (!cacheKey) {
            this._cache.clear();
            return;
        } else if (Array.isArray(cacheKey)) {
            for (const key of cacheKey) {
                this._cache.delete(key.get());
            }
            return;
        }

        this._cache.delete(cacheKey.get());
    }
}

export const createMemoryCache = <T>(): ICache<T> => {
    return Cache.create<T>();
};
