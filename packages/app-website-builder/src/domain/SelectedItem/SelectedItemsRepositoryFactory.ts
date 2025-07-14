import { SelectedItemsRepository } from "./SelectedItemsRepository";
import type { ISelectedItemsRepository } from "~/domain/SelectedItem/ISelectedItemsRepository.js";

export class SelectedItemsRepositoryFactory {
    private cache: Map<string, ISelectedItemsRepository<any>> = new Map();

    getRepository<T = any>(namespace?: string): ISelectedItemsRepository<T> {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new SelectedItemsRepository<T>());
        }

        return this.cache.get(cacheKey) as ISelectedItemsRepository<T>;
    }

    private getCacheKey(namespace?: string) {
        return namespace ?? Date.now().toString();
    }
}

export const selectedItemsRepositoryFactory = new SelectedItemsRepositoryFactory();
