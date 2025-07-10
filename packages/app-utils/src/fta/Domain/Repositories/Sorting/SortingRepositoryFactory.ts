import { SortingRepository } from "./SortingRepository";
import type { ISortingRepository } from "~/fta/index.js";

export class SortingRepositoryFactory {
    private cache: Map<string, ISortingRepository> = new Map();

    getRepository(namespace?: string) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new SortingRepository());
        }

        return this.cache.get(cacheKey) as ISortingRepository;
    }

    private getCacheKey(namespace?: string) {
        return namespace ?? Date.now().toString();
    }
}

export const sortRepositoryFactory = new SortingRepositoryFactory();
