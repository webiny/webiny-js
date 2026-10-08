import { type Container, createFeature } from "@webiny/feature/api";
import { DynamoDBClient } from "@webiny/db-dynamodb";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import { createStorage } from "./Storage.js";

export interface AuditLogsDdbFeatureConfig {
    tableName?: string;
}

export const AuditLogsDdbFeature = createFeature({
    name: "AuditLogsDdb",
    register(container: Container, config: AuditLogsDdbFeatureConfig = {}) {
        CompressionFeature.register(container);
        // Lazy factory: DynamoDBClient and CompressionHandler are resolved at first use
        container.registerFactory(AuditLogsStorage, () => {
            const db = container.resolve(DynamoDBClient);
            const compressionHandler = container.resolve(CompressionHandler);
            return createStorage({
                client: db.client,
                // Audit logs have their own table (`DB_TABLE_AUDIT_LOGS`, which the entity falls back
                // to), with numeric index sort keys. Passing `DB_TABLE` here sent them to the main
                // table, whose GSI1_SK is a string, and every audited write failed there.
                tableName: config.tableName,
                compressionHandler
            });
        });
    }
});
