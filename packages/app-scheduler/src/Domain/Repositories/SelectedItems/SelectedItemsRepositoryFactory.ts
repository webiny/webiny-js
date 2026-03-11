import { SelectedItemsRepository } from "./SelectedItemsRepository.js";

export class SelectedItemsRepositoryFactory {
    private readonly cache: Map<string, SelectedItemsRepository> = new Map();

    public getRepository() {
        const cacheKey = this.getCacheKey();

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new SelectedItemsRepository());
        }

        return this.cache.get(cacheKey) as SelectedItemsRepository;
    }

    private getCacheKey() {
        return Date.now().toString();
    }
}

export const selectedItemsRepositoryFactory = new SelectedItemsRepositoryFactory();
