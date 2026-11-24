// A deep import: the connection feature loads this, and the package root pulls in all of api-core.
import { TenancyStorageOperationsFactory } from "@webiny/api-core/features/storageOperations/abstractions.js";
import type { TenancyStorageOperations } from "@webiny/api-core/types/tenancy.js";
import { KnexClient } from "~/feature/KnexClient/index.js";
import { SqlSchemaConfig } from "~/schemaConfig/index.js";
import { TableManager } from "~/TableManager.js";
import { createStorageOperations as createTenancyStorageOperations } from "~/tenancy/index.js";

/**
 * The tenant registry's storage on the container's connection: the tenants table only. The request
 * container reads the request's tenant from it, before any tenant scope (with the rest of the core
 * storage) exists.
 */
class SqlTenancyStorageOperationsFactoryImpl implements TenancyStorageOperationsFactory.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schemaConfig?: SqlSchemaConfig.Interface
    ) {}

    public create(): TenancyStorageOperations {
        const knex = this.knex.client;
        const tableManager = new TableManager(knex, this.schemaConfig?.tableNamePrefix, {
            schemaManaged: this.schemaConfig?.isManaged() === true
        });
        return createTenancyStorageOperations({ knex, tableManager });
    }
}

export const SqlTenancyStorageOperationsFactory =
    TenancyStorageOperationsFactory.createImplementation({
        implementation: SqlTenancyStorageOperationsFactoryImpl,
        dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
    });
