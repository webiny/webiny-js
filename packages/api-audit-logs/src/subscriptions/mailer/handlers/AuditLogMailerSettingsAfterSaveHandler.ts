import WebinyError from "@webiny/error";
import { MailerSettingsAfterSaveEventHandler } from "@webiny/api-mailer";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogMailerSettingsAfterSaveHandlerImpl
    implements MailerSettingsAfterSaveEventHandler.Interface
{
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: MailerSettingsAfterSaveEventHandler.Event): Promise<void> {
        try {
            // Any transport with stored settings publishes this event; secrets are already left out.
            const { transport, settings } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.MAILER.SETTINGS.UPDATE,
                message: "Settings updated",
                content: { after: { transport, ...settings } },
                entityId: transport
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
