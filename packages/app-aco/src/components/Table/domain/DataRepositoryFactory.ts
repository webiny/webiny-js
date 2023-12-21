import { DataRepository } from "./DataRepository";

class DataRepositoryFactory {
    private cache: Map<string, DataRepository<any>> = new Map();

    getRepository<T>(namespace: string) {
        if (!this.cache.has(namespace)) {
            this.cache.set(namespace, new DataRepository());
        }

        return this.cache.get(namespace) as DataRepository<T>;
    }
}

export const dataRepositoryFactory = new DataRepositoryFactory();
