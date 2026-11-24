import WebinyError from "@webiny/error";
import { AUDIT } from "@webiny/api-audit-logs";
import { RecordAuditLogUseCase } from "@webiny/api-audit-logs/features/RecordAuditLog/abstractions.js";
import { MailerSettingsAfterSaveEventHandler } from "~/api/features/SaveSettings/abstractions.js";

class AuditLogMailerSettingsAfterSaveHandlerImpl
    implements MailerSettingsAfterSaveEventHandler.Interface
{
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: MailerSettingsAfterSaveEventHandler.Event): Promise<void> {
        try {
            const { settings } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.MAILER.SETTINGS.UPDATE,
                message: "Settings updated",
                content: { after: settings },
                entityId: "-"
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogMailerSettingsAfterSaveHandler",
                code: "AUDIT_LOGS_AFTER_MAILER_SETTINGS_SAVE_HANDLER"
            });
        }
    }
}

export const AuditLogMailerSettingsAfterSaveHandler =
    MailerSettingsAfterSaveEventHandler.createImplementation({
        implementation: AuditLogMailerSettingsAfterSaveHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
