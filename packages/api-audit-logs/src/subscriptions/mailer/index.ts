import { AuditLogMailerSettingsAfterSaveHandler } from "./handlers/AuditLogMailerSettingsAfterSaveHandler.js";
import { AuditLogsContext } from "~/abstractions.js";

export const createMailerHooks = (context: AuditLogsContext.Interface) => {
    // Register mailer settings event handlers
    context.container.register(AuditLogMailerSettingsAfterSaveHandler);
};
