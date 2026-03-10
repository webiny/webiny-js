import WebinyError from "@webiny/error";
import { MailerSettingsAfterSaveEventHandler } from "@webiny/api-mailer/features/SaveSettings/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogMailerSettingsAfterSaveHandlerImpl
    implements MailerSettingsAfterSaveEventHandler.Interface
{
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: MailerSettingsAfterSaveEventHandler.Event): Promise<void> {
        try {
            const { settings } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.MAILER.SETTINGS.UPDATE);

            await createAuditLog("Settings updated", { after: settings }, "-", this.context);
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
        dependencies: [AuditLogsContext]
    });
