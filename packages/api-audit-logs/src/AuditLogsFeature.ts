import { createFeature, type Container } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { AuditLogsConfig } from "./abstractions.js";
import { AuditLogs } from "./features/AuditLogs.js";
import { AuditLogRecorder } from "./features/AuditLogRecorder.js";
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
        container.register(AuditLogs);
        container.register(AuditLogRecorder);
        container.register(AuditLogsGraphQLSchema);

        createSubscriptionHooks(container);
    }
});
