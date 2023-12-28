import { ColumnsRepository } from "./ColumnsRepository";
import { ColumnDTO } from "./Column";

class ColumnsRepositoryFactory {
    private cache: Map<string, ColumnsRepository> = new Map();

    getRepository(namespace: string, columns: ColumnDTO[]) {
        const cacheKey = this.getCacheKey(namespace, columns);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new ColumnsRepository(columns));
        }

        return this.cache.get(cacheKey) as ColumnsRepository;
    }

    private getCacheKey(namespace: string, columns: ColumnDTO[]) {
        return [namespace, ...columns.map(column => column.name)].join("#");
    }
}

export const columnsRepositoryFactory = new ColumnsRepositoryFactory();
