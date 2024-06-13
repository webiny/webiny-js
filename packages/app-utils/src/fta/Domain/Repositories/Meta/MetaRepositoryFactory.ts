import { MetaRepository } from "./MetaRepository";

export class MetaRepositoryFactory {
    private cache: Map<string, MetaRepository> = new Map();

    getRepository() {
        const cacheKey = this.getCacheKey();

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new MetaRepository());
        }

        return this.cache.get(cacheKey) as MetaRepository;
    }

    private getCacheKey() {
        return Date.now().toString();
    }
}

export const metaRepositoryFactory = new MetaRepositoryFactory();
