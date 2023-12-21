import { ColumnVisibility as IColumnVisibility } from "@webiny/ui/DataTable";
import { ColumnRepository } from "./ColumnRepository";
import { LocalStorage } from "~/components/Table/LocalStorage";
import { ColumnDTO } from "~/components/Table/domain/Column";

class ColumnRepositoryFactory {
    private cache: Map<string, ColumnRepository> = new Map();

    getRepository(namespace: string, columns: ColumnDTO[]) {
        const cacheKey = this.getCacheKey(namespace, columns);

        if (!this.cache.has(cacheKey)) {
            const visibilityStorage = new LocalStorage<IColumnVisibility>(
                `webiny_column_visibility_${namespace}`
            );
            this.cache.set(cacheKey, new ColumnRepository(columns, visibilityStorage));
        }

        return this.cache.get(cacheKey) as ColumnRepository;
    }

    private getCacheKey(namespace: string, columns: ColumnDTO[]) {
        return [namespace, ...columns.map(column => column.name)].join("#");
    }
}

export const columnRepositoryFactory = new ColumnRepositoryFactory();
