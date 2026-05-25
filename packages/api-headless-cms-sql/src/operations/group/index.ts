import type { Knex } from "knex";
import type { CmsGroupStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { TableNameResolver } from "~/utils/TableNameResolver.js";

interface CreateGroupsStorageOperationsParams {
    knex: Knex;
    tableNameResolver: TableNameResolver;
}

export const createGroupsStorageOperations = (
    _params: CreateGroupsStorageOperationsParams
): CmsGroupStorageOperations => {
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
