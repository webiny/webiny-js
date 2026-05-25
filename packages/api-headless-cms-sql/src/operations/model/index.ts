import type { Knex } from "knex";
import type { CmsModelStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { TableNameResolver } from "~/utils/TableNameResolver.js";

interface CreateModelsStorageOperationsParams {
    knex: Knex;
    tableNameResolver: TableNameResolver;
}

export const createModelsStorageOperations = (
    _params: CreateModelsStorageOperationsParams
): CmsModelStorageOperations => {
    return {
        get: async () => {
            throw new Error("Not implemented.");
        },
        list: async () => {
            throw new Error("Not implemented.");
        },
        create: async () => {
            throw new Error("Not implemented.");
        },
        update: async () => {
            throw new Error("Not implemented.");
        },
        delete: async () => {
            throw new Error("Not implemented.");
        }
    };
};
