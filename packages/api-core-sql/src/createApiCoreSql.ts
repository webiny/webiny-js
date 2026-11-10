import type { Knex } from "knex";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { createStorageOperations as createUsersStorageOperations } from "./adminUsers/index.js";
import { createStorageOperations as createTenancyStorageOperations } from "./tenancy/index.js";
import { createStorageOperations as createSecurityStorageOperations } from "./security/index.js";
import { createStorageOperations as createKeyValueStorageOperations } from "./keyValueStore/index.js";
import { TableManager } from "./TableManager.js";
import { SqlServiceManifestLoader } from "./serviceDiscovery/index.js";

interface CreateApiCoreSqlParams {
    knex: Knex;
    tableNamePrefix?: string;
    /** The schema was set up before the API took traffic: no table checks at runtime. */
    schemaManaged?: boolean;
}

export const createApiCoreSql = ({
    knex,
    tableNamePrefix,
    schemaManaged
}: CreateApiCoreSqlParams): ApiCoreStorageOperations => {
    const tableManager = new TableManager(knex, tableNamePrefix, { schemaManaged });

    ServiceDiscovery.setLoader(new SqlServiceManifestLoader(knex, tableManager));

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
