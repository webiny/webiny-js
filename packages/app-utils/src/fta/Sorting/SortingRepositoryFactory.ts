import { SortingRepository } from "./SortingRepository";
import { SortingDTO } from "~/fta";

export class SortingRepositoryFactory {
    private cache: Map<string, SortingRepository> = new Map();

    getRepository(sortings: SortingDTO[]) {
        const cacheKey = this.getCacheKey();

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new SortingRepository(sortings));
        }

        return this.cache.get(cacheKey) as SortingRepository;
    }

    private getCacheKey() {
        return Date.now().toString();
    }
}

export const sortRepositoryFactory = new SortingRepositoryFactory();
