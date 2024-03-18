import { SortRepository } from "~/domain/SortRepository";
import { Sort } from "~/domain/Sort";

export class SortRepositoryFactory {
    private cache: Map<string, SortRepository> = new Map();

    getRepository(sorts: Sort[]) {
        const cacheKey = this.getCacheKey();

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new SortRepository(sorts));
        }

        return this.cache.get(cacheKey) as SortRepository;
    }

    private getCacheKey() {
        return Date.now().toString();
    }
}

export const sortRepositoryFactory = new SortRepositoryFactory();
