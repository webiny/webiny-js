import WebinyError from "@webiny/error";
import { SettingsAfterUpdateEventHandler } from "@webiny/api-file-manager/features/settings/UpdateSettings/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogSettingsAfterUpdateHandlerImpl implements SettingsAfterUpdateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: SettingsAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { settings, original } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.FILE_MANAGER.SETTINGS.UPDATE,
                message: "Settings updated",
                content: { before: original, after: settings },
                entityId: "-"
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogSettingsAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_SETTINGS_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogSettingsAfterUpdateHandler =
    SettingsAfterUpdateEventHandler.createImplementation({
        implementation: AuditLogSettingsAfterUpdateHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
