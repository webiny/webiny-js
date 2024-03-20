import { SelectedItemsRepository } from "~/components/TrashBin/domain/SelectedItemsRepository";

export class SelectedItemsRepositoryFactory {
    private cache: Map<string, SelectedItemsRepository> = new Map();

    getRepository() {
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
