import { SortingRepository } from "./SortingRepository";

export class SortingRepositoryFactory {
    private cache: Map<string, SortingRepository> = new Map();

    getRepository(namespace?: string) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new SortingRepository());
        }

        return this.cache.get(cacheKey) as SortingRepository;
    }

    private getCacheKey(namespace?: string) {
        return namespace ?? Date.now().toString();
    }
}

export const sortRepositoryFactory = new SortingRepositoryFactory();
