import { createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { AuditLogMailerSettingsAfterSaveHandler } from "./AuditLogMailerSettingsAfterSaveHandler.js";

/*
 * Records an audit log when the SMTP settings are saved. Audit logs are license-gated and
 * `AuditLogsFeature` registers `RecordAuditLogUseCase` only when the flag is on, so the handler is
 * gated the same way.
 */
export const AuditLogFeature = createFeature({
    name: "MailerSmtp/AuditLog",
    register(container) {
        if (!container.resolve(FeatureFlags).get().isEnabled("auditLogs")) {
            return;
        }
        container.register(AuditLogMailerSettingsAfterSaveHandler);
    }
});
