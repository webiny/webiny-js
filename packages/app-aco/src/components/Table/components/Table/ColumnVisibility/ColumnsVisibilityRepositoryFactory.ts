import { ColumnsVisibilityRepository } from "./ColumnsVisibilityRepository";
import { IColumnsVisibilityGateway } from "../gateways/IColumnsVisibilityGateway";

class ColumnsVisibilityRepositoryFactory {
    private cache: Map<string, ColumnsVisibilityRepository> = new Map();

    getRepository(namespace: string, gateway: IColumnsVisibilityGateway) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new ColumnsVisibilityRepository(gateway));
        }

        return this.cache.get(cacheKey) as ColumnsVisibilityRepository;
    }

    private getCacheKey(namespace: string) {
        return namespace;
    }
}

export const columnsVisibilityRepositoryFactory = new ColumnsVisibilityRepositoryFactory();
