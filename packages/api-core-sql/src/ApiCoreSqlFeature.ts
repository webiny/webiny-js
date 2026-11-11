import { createFeature } from "@webiny/feature/api";
import { ApiCoreStorageOperationsFactory } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createApiCoreSql, createApiCoreSqlOperations } from "./createApiCoreSql.js";
import { KnexClient } from "./feature/KnexClient/index.js";
import { SqlSchemaConfig } from "./schemaConfig/index.js";
import { SqlSchemaSetup } from "./schemaSetup/index.js";
import { TableManager } from "./TableManager.js";
import { defineServiceManifestsTable } from "./serviceDiscovery/serviceManifestsTable.js";

/** Builds the core storage operations on the container's connection and table prefix. */
class SqlApiCoreStorageOperationsFactoryImpl implements ApiCoreStorageOperationsFactory.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schemaConfig?: SqlSchemaConfig.Interface
    ) {}

    public create(): ApiCoreStorageOperations {
        return createApiCoreSql({
            knex: this.knex.client,
            tableNamePrefix: this.schemaConfig?.tableNamePrefix,
            schemaManaged: this.schemaConfig?.isManaged() === true
        });
    }
}

const SqlApiCoreStorageOperationsFactory = ApiCoreStorageOperationsFactory.createImplementation({
    implementation: SqlApiCoreStorageOperationsFactoryImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});

/**
 * The `core` schema setup step: the tables of users, tenancy, security, the key-value store and the
 * service manifests, on the container's connection.
 */
class CoreSqlSchemaSetupImpl implements SqlSchemaSetup.Interface {
    public readonly name = "core";

    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schemaConfig?: SqlSchemaConfig.Interface
    ) {}

    public async setup(): Promise<void> {
        const knex = this.knex.client;
        const tableManager = new TableManager(knex, this.schemaConfig?.tableNamePrefix);
        // Building them declares their tables on the manager.
        createApiCoreSqlOperations(knex, tableManager);
        defineServiceManifestsTable(tableManager);
        await tableManager.setup();
    }
}

const CoreSqlSchemaSetup = SqlSchemaSetup.createImplementation({
    implementation: CoreSqlSchemaSetupImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});

/**
 * The SQL core storage of a request: the implementation of `ApiCoreStorageOperationsFactory`, which
 * `ApiCoreFeature.register` resolves and builds, and the `core` schema setup step. Mirrors
 * `ApiCoreDdbFeature`.
 *
 * Registered per request (by the SQL storage's `RequestStorage`). It runs on what the root holds:
 * the connection (`KnexClient`) and the table prefix and schema-managed setting (`SqlSchemaConfig`),
 * both registered by `SqlConnectionFeature`.
 */
export const ApiCoreSqlFeature = createFeature({
    name: "ApiCoreSql",
    register(container) {
        container.register(SqlApiCoreStorageOperationsFactory);
        container.register(CoreSqlSchemaSetup);
    }
});
