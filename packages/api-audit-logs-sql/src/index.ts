import { createFeature } from "@webiny/feature/api";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { KnexClient, SqlSchemaConfig, SqlSchemaSetup } from "@webiny/api-core-sql";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import { SqliteStorage } from "~/SqliteStorage.js";

const createTableManager = (
    knex: KnexClient.Interface,
    schemaConfig: SqlSchemaConfig.Interface | undefined,
    schemaManaged: boolean
): TableManager => {
    return new TableManager(knex.client, schemaConfig?.tableNamePrefix, { schemaManaged });
};

/** The audit logs storage on the container's connection and table prefix. */
class SqlAuditLogsStorageImpl extends SqliteStorage implements AuditLogsStorage.Interface {
    public constructor(knex: KnexClient.Interface, schemaConfig?: SqlSchemaConfig.Interface) {
        const schemaManaged = schemaConfig?.isManaged() === true;
        super({
            knex: knex.client,
            tableManager: createTableManager(knex, schemaConfig, schemaManaged)
        });
    }
}

const SqlAuditLogsStorage = AuditLogsStorage.createImplementation({
    implementation: SqlAuditLogsStorageImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});

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

const AuditLogsSqlSchemaSetup = SqlSchemaSetup.createImplementation({
    implementation: AuditLogsSqlSchemaSetupImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});

/**
 * The SQL audit logs storage and its `auditLogs` schema setup step. Registered per request, it runs
 * on the connection (`KnexClient`) and the table settings (`SqlSchemaConfig`) the SQL storage keeps
 * in the root.
 */
export const AuditLogsSqlFeature = createFeature({
    name: "AuditLogsSql",
    register(container) {
        container.register(SqlAuditLogsStorage);
        container.register(AuditLogsSqlSchemaSetup);
    }
});

/** `AuditLogsSqlFeature` as an extension plugin, for setups that register storages that way. */
export const registerAuditLogsSqlStorageOperations = () => {
    return createRegisterExtensionPlugin(context => {
        AuditLogsSqlFeature.register(context.container);
    });
};
