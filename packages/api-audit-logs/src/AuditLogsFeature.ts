import { createFeature, type Container } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { AuditLogsConfig } from "./abstractions.js";
import { AuditLogPermissionsFeature } from "./features/AuditLogPermissions/feature.js";
import { CreateAuditLogFeature } from "./features/CreateAuditLog/feature.js";
import { UpdateAuditLogFeature } from "./features/UpdateAuditLog/feature.js";
import { GetAuditLogFeature } from "./features/GetAuditLog/feature.js";
import { ListAuditLogsFeature } from "./features/ListAuditLogs/feature.js";
import { RecordAuditLogFeature } from "./features/RecordAuditLog/feature.js";
import { createSubscriptionHooks } from "./subscriptions/index.js";
import { AuditLogsGraphQLSchema } from "./graphql/AuditLogsGraphQLSchema.js";

export interface AuditLogsFeatureConfig {
    deleteLogsAfterDays?: number;
}

const getDeleteLogsAfterDays = (days?: number): number => {
    return days && days > 0 ? days : 60;
};

export const AuditLogsFeature = createFeature({
    name: "AuditLogs",
    register(container: Container, config: AuditLogsFeatureConfig = {}) {
        // Audit logs are license-gated — check at register time (license is fresh pre-register) so
        // nothing wires up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("auditLogs")) {
            return;
        }

        container.registerInstance(AuditLogsConfig, {
            deleteLogsAfterDays: getDeleteLogsAfterDays(config.deleteLogsAfterDays)
        });
        AuditLogPermissionsFeature.register(container);
        CreateAuditLogFeature.register(container);
        UpdateAuditLogFeature.register(container);
        GetAuditLogFeature.register(container);
        ListAuditLogsFeature.register(container);
        RecordAuditLogFeature.register(container);
        container.register(AuditLogsGraphQLSchema);

        createSubscriptionHooks(container);
    }
});
