import { LoadingRepository } from "./LoadingRepository";

export class LoadingRepositoryFactory {
    private cache: Map<string, LoadingRepository> = new Map();

    getRepository(namespace?: string) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new LoadingRepository());
        }

        return this.cache.get(cacheKey) as LoadingRepository;
    }

    private getCacheKey(namespace?: string) {
        return namespace ?? Date.now().toString();
    }
}

export const loadingRepositoryFactory = new LoadingRepositoryFactory();
