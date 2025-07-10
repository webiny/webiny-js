import { SearchRepository } from "./SearchRepository";

export class SearchRepositoryFactory {
    private cache: Map<string, SearchRepository> = new Map();

    getRepository(namespace?: string) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new SearchRepository());
        }

        return this.cache.get(cacheKey) as SearchRepository;
    }

    private getCacheKey(namespace?: string) {
        return namespace ?? Date.now().toString();
    }
}

export const searchRepositoryFactory = new SearchRepositoryFactory();
