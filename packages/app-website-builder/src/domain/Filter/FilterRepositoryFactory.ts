import { FilterRepository } from "./FilterRepository.js";
import type { IFilterRepository } from "./IFilterRepository.js";

export class FilterRepositoryFactory {
    private cache: Map<string, IFilterRepository> = new Map();

    getRepository(namespace?: string) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new FilterRepository());
        }

        return this.cache.get(cacheKey) as IFilterRepository;
    }

    private getCacheKey(namespace?: string) {
        return namespace ?? Date.now().toString();
    }
}

export const filterRepositoryFactory = new FilterRepositoryFactory();
