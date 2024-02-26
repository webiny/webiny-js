export type ICacheKeyKeys = Record<string, string | undefined> | string | number;

export interface ICacheKey {
    get(): string;
    keys: ICacheKeyKeys;
}

export interface ICache<T = any> {
    get(cacheKey: ICacheKey): T | null;
    set(cacheKey: ICacheKey, value: T): T;
    getOrSet(cacheKey: ICacheKey, cb: () => T): T;
    clear(cacheKey?: ICacheKey | ICacheKey[]): void;
}
