import { createFeature } from "@webiny/feature/api";
import { DynamoDBClient } from "@webiny/db-dynamodb";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import type { Container } from "@webiny/di";
import { createStorage } from "./Storage.js";

export interface AuditLogsDdbFeatureConfig {
    tableName?: string;
}

export const AuditLogsDdbFeature = createFeature({
    name: "AuditLogsDdb",
    register(container: Container, config: AuditLogsDdbFeatureConfig = {}) {
        // Lazy factory: DynamoDBClient and CompressionHandler are resolved at first use
        container.registerFactory(AuditLogsStorage, () => {
            const db = container.resolve(DynamoDBClient);
            const compressionHandler = container.resolve(CompressionHandler);
            return createStorage({
                client: db.client,
                tableName: config.tableName ?? process.env.DB_TABLE,
                compressionHandler
            });
        });
    }
});
