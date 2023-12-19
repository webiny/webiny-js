import { ColumnRepository } from "./ColumnRepository";
import { ColumnDTO } from "~/components/Table/domain/Column";

class ColumnRepositoryFactory {
    private cache: Map<string, ColumnRepository> = new Map();

    getRepository(namespace: string, columns: ColumnDTO[]) {
        const cacheKey = this.getCacheKey(namespace, columns);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new ColumnRepository(namespace, columns));
        }

        return this.cache.get(cacheKey) as ColumnRepository;
    }

    private getCacheKey(namespace: string, columns: ColumnDTO[]) {
        return [namespace, ...columns.map(column => column.name)].join("#");
    }
}

export const columnRepositoryFactory = new ColumnRepositoryFactory();
