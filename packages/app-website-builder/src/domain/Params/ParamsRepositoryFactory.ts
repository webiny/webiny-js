import { ParamsRepository } from "./ParamsRepository.js";
import type { IParamsRepository } from "./IParamsRepository.js";

export class ParamsRepositoryFactory {
    private cache: Map<string, IParamsRepository> = new Map();

    getRepository(namespace?: string) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new ParamsRepository());
        }

        return this.cache.get(cacheKey) as IParamsRepository;
    }

    private getCacheKey(namespace?: string) {
        return namespace ?? Date.now().toString();
    }
}

export const paramsRepositoryFactory = new ParamsRepositoryFactory();
