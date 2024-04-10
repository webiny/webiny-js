import { SearchRepository } from "./SearchRepository";

export class SearchRepositoryFactory {
    private cache: Map<string, SearchRepository> = new Map();

    getRepository() {
        const cacheKey = this.getCacheKey();

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new SearchRepository());
        }

        return this.cache.get(cacheKey) as SearchRepository;
    }

    private getCacheKey() {
        return Date.now().toString();
    }
}

export const searchRepositoryFactory = new SearchRepositoryFactory();
