import { KnexClient, SqlSchemaConfig } from "@webiny/api-core-sql";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import { SqliteStorage } from "~/SqliteStorage.js";
import { createTableManager } from "~/createTableManager.js";

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

export const SqlAuditLogsStorage = AuditLogsStorage.createImplementation({
    implementation: SqlAuditLogsStorageImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});
