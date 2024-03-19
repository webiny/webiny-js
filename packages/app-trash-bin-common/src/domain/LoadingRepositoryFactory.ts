import { LoadingRepository } from "~/domain/LoadingRepository";

export class LoadingRepositoryFactory {
    private cache: Map<string, LoadingRepository> = new Map();

    getRepository() {
        const cacheKey = this.getCacheKey();

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new LoadingRepository());
        }

        return this.cache.get(cacheKey) as LoadingRepository;
    }

    private getCacheKey() {
        return Date.now().toString();
    }
}

export const loadingRepositoryFactory = new LoadingRepositoryFactory();
