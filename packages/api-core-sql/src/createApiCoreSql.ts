import type { Knex } from "knex";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createStorageOperations as createUsersStorageOperations } from "./adminUsers/index.js";
import { createStorageOperations as createTenancyStorageOperations } from "./tenancy/index.js";
import { createStorageOperations as createSecurityStorageOperations } from "./security/index.js";
import { createStorageOperations as createKeyValueStorageOperations } from "./keyValueStore/index.js";
import { TableManager } from "./TableManager.js";
import type { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";

interface CreateApiCoreSqlParams {
    knex: Knex;
    tableNamePrefix?: string;
    /** The schema was set up before the API took traffic: no table checks at runtime. */
    schemaManaged?: boolean;
    /**
     * The tenant the storage acts on: its tenant scope's. The tenant records and the key-value store
     * don't use it (the tenant registry is tenant-neutral, and the store is keyed by its own scope).
     */
    scopeTenant: ScopeTenant.Interface;
}

/**
 * The core storage operations (users, tenancy, security, key-value store) on `tableManager`, which
 * they declare their tables on.
 */
export const createApiCoreSqlOperations = (
    knex: Knex,
    tableManager: TableManager,
    scopeTenant: ScopeTenant.Interface
): ApiCoreStorageOperations => {
    return {
        usersStorageOperations: createUsersStorageOperations({ knex, tableManager, scopeTenant }),
        tenancyStorageOperations: createTenancyStorageOperations({ knex, tableManager }),
        securityStorageOperations: createSecurityStorageOperations({
            knex,
            tableManager,
            scopeTenant
        }),
        keyValueStorageOperations: createKeyValueStorageOperations({ knex, tableManager })
    };
};

/**
 * The core storage operations on a connection. Cheap to build: what the table checks learn is kept
 * for the process (see `TableManager`), so they are built per request.
 */
export const createApiCoreSql = ({
    knex,
    tableNamePrefix,
    schemaManaged,
    scopeTenant
}: CreateApiCoreSqlParams): ApiCoreStorageOperations => {
    const tableManager = new TableManager(knex, tableNamePrefix, { schemaManaged });
    return createApiCoreSqlOperations(knex, tableManager, scopeTenant);
};
