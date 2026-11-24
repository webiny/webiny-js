import { createApiCoreSqlOperations } from "~/createApiCoreSql.js";
import { KnexClient } from "~/feature/KnexClient/index.js";
import { SqlSchemaConfig } from "~/schemaConfig/index.js";
import { SqlSchemaSetup } from "~/schemaSetup/index.js";
import { TableManager } from "~/TableManager.js";
import { defineServiceManifestsTable } from "~/serviceDiscovery/serviceManifestsTable.js";

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

export const CoreSqlSchemaSetup = SqlSchemaSetup.createImplementation({
    implementation: CoreSqlSchemaSetupImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});
