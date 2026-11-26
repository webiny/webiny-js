import { type Container, createFeature } from "@webiny/feature/api";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { AuditLogsDdbConfig } from "~/abstractions/AuditLogsDdbConfig.js";
import { DdbAuditLogsStorage } from "./DdbAuditLogsStorage.js";

export interface AuditLogsDdbFeatureConfig {
    tableName?: string;
}

export const AuditLogsDdbFeature = createFeature({
    name: "AuditLogsDdb",
    register(container: Container, config: AuditLogsDdbFeatureConfig = {}) {
        CompressionFeature.register(container);
        // Registered once, in the root, and built in each tenant scope with the scope's tenant.
        // Audit logs have their own table (`DB_TABLE_AUDIT_LOGS`, which the entity falls back to),
        // with numeric index sort keys. Passing `DB_TABLE` here sent them to the main table, whose
        // GSI1_SK is a string, and every audited write failed there.
        container.registerInstance(AuditLogsDdbConfig, { tableName: config.tableName });
        container.register(DdbAuditLogsStorage).inContainerScope();
    }
});
