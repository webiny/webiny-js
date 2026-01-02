import WebinyError from "@webiny/error";
import { SettingsAfterUpdateHandler } from "@webiny/api-file-manager/features/settings/UpdateSettings/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogSettingsAfterUpdateHandlerImpl implements SettingsAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: SettingsAfterUpdateHandler.Event): Promise<void> {
        try {
            const { settings, original } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.SETTINGS.UPDATE);

            await createAuditLog(
                "Settings updated",
                { before: original, after: settings },
                "-",
                this.context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogSettingsAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_SETTINGS_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogSettingsAfterUpdateHandler = SettingsAfterUpdateHandler.createImplementation({
    implementation: AuditLogSettingsAfterUpdateHandlerImpl,
    dependencies: [AuditLogsContext]
});
