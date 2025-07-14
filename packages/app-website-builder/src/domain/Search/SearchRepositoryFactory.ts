import { SearchRepository } from "./SearchRepository.js";
import type { ISearchRepository } from "./ISearchRepository.js";

export class SearchRepositoryFactory {
    private cache: Map<string, ISearchRepository> = new Map();

    getRepository(namespace?: string) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new SearchRepository());
        }

        return this.cache.get(cacheKey) as ISearchRepository;
    }

    private getCacheKey(namespace?: string) {
        return namespace ?? Date.now().toString();
    }
}

export const searchRepositoryFactory = new SearchRepositoryFactory();
