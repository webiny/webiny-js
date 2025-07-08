import { ParamsRepository } from "./ParamsRepository.js";

export class ParamsRepositoryFactory {
    private cache: Map<string, ParamsRepository> = new Map();

    getRepository(namespace?: string) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new ParamsRepository());
        }

        return this.cache.get(cacheKey) as ParamsRepository;
    }

    private getCacheKey(namespace?: string) {
        return namespace ?? Date.now().toString();
    }
}

export const paramsRepositoryFactory = new ParamsRepositoryFactory();
