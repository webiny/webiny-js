import type { CreateAcoParams } from "~/types.js";
import type { AcoFilterCrud } from "./filter.types.js";

export const createFilterCrudMethods = ({ storageOperations }: CreateAcoParams): AcoFilterCrud => {
    return {
        async get(id) {
            return storageOperations.filter.getFilter({ id });
        },
        async list(params) {
            return storageOperations.filter.listFilters(params);
        },
        async create(data) {
            return storageOperations.filter.createFilter({ data });
        },
        async update(id, data) {
            return await storageOperations.filter.updateFilter({ id, data });
        },
        async delete(id: string) {
            await storageOperations.filter.deleteFilter({ id });
            return true;
        }
    };
};
