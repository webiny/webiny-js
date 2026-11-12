import { KnexClient, SqlSchemaConfig, SqlSchemaSetup } from "@webiny/api-core-sql";
import { SqliteStorage } from "~/SqliteStorage.js";
import { createTableManager } from "~/createTableManager.js";

/** The `auditLogs` schema setup step: the audit logs table. */
class AuditLogsSqlSchemaSetupImpl implements SqlSchemaSetup.Interface {
    public readonly name = "auditLogs";

    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schemaConfig?: SqlSchemaConfig.Interface
    ) {}

    public async setup(): Promise<void> {
        const tableManager = createTableManager(this.knex, this.schemaConfig, false);
        // Building the storage declares its table on the manager.
        new SqliteStorage({ knex: this.knex.client, tableManager });
        await tableManager.setup();
    }
}

export const AuditLogsSqlSchemaSetup = SqlSchemaSetup.createImplementation({
    implementation: AuditLogsSqlSchemaSetupImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});
