import { createAbstraction } from "@webiny/feature/api";
import { DynamoDBClient } from "@webiny/db-dynamodb";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { Storage } from "./Storage.js";

export interface IAuditLogsDdbConfig {
    /** Falls back to the entity's own default (`DB_TABLE_AUDIT_LOGS`). */
    tableName?: string;
}

export const AuditLogsDdbConfig = createAbstraction<IAuditLogsDdbConfig>("AuditLogsDdbConfig");

export namespace AuditLogsDdbConfig {
    export type Interface = IAuditLogsDdbConfig;
}

/** Audit logs on DynamoDB, built in each tenant scope for the scope's tenant. */
class DdbAuditLogsStorageImpl extends Storage implements AuditLogsStorage.Interface {
    public constructor(
        db: DynamoDBClient.Interface,
        compressionHandler: CompressionHandler.Interface,
        scopeTenant: ScopeTenant.Interface,
        config?: AuditLogsDdbConfig.Interface
    ) {
        super({ client: db.client, tableName: config?.tableName, compressionHandler, scopeTenant });
    }
}

export const DdbAuditLogsStorage = AuditLogsStorage.createImplementation({
    implementation: DdbAuditLogsStorageImpl,
    dependencies: [
        DynamoDBClient,
        CompressionHandler,
        ScopeTenant,
        [AuditLogsDdbConfig, { optional: true }]
    ]
});
