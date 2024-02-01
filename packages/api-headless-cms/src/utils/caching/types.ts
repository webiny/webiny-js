import { ICacheKeyKeys } from "@webiny/utils";

export { ICacheKeyKeys };

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
