import { MetaRepository } from "./MetaRepository";

export class MetaRepositoryFactory {
    private cache: Map<string, MetaRepository> = new Map();

    getRepository(namespace?: string) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new MetaRepository());
        }

        return this.cache.get(cacheKey) as MetaRepository;
    }

    private getCacheKey(namespace?: string) {
        return namespace ?? Date.now().toString();
    }
}

export const metaRepositoryFactory = new MetaRepositoryFactory();
