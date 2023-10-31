export interface ICacheKey {
    get(): string;
}

export interface ICache<T = any> {
    get(cacheKey: ICacheKey): T | null;
    set(cacheKey: ICacheKey, value: T): T;
    getOrSet(cacheKey: ICacheKey, cb: () => T): T;
    clear(cacheKey?: ICacheKey | ICacheKey[]): void;
}
