import type { Knex } from "knex";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createStorageOperations as createUsersStorageOperations } from "./adminUsers/index.js";
import { createStorageOperations as createTenancyStorageOperations } from "./tenancy/index.js";
import { createStorageOperations as createSecurityStorageOperations } from "./security/index.js";
import { createStorageOperations as createKeyValueStorageOperations } from "./keyValueStore/index.js";
import { TableManager } from "./TableManager.js";

interface CreateApiCoreSqlParams {
    knex: Knex;
    tableNamePrefix?: string;
}

export const createApiCoreSql = ({
    knex,
    tableNamePrefix
}: CreateApiCoreSqlParams): ApiCoreStorageOperations => {
    const tableManager = new TableManager(knex, tableNamePrefix);

    return {
        usersStorageOperations: createUsersStorageOperations({
            knex,
            tableManager
        }),
        tenancyStorageOperations: createTenancyStorageOperations({
            knex,
            tableManager
        }),
        securityStorageOperations: createSecurityStorageOperations({
            knex,
            tableManager
        }),
        keyValueStorageOperations: createKeyValueStorageOperations({
            knex,
            tableManager
        })
    };
};
