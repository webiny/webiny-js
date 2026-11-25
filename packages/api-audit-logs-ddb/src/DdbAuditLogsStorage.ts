import { DynamoDBClient } from "@webiny/db-dynamodb";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { AuditLogsDdbConfig } from "~/abstractions/AuditLogsDdbConfig.js";
import { Storage } from "./Storage.js";

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
