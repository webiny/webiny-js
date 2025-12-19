import { AuditLogFileAfterCreateHandler } from "./handlers/AuditLogFileAfterCreateHandler.js";
import { AuditLogFileAfterUpdateHandler } from "./handlers/AuditLogFileAfterUpdateHandler.js";
import { AuditLogFileAfterDeleteHandler } from "./handlers/AuditLogFileAfterDeleteHandler.js";
import { AuditLogSettingsAfterUpdateHandler } from "./handlers/AuditLogSettingsAfterUpdateHandler.js";
import { AuditLogsContext } from "~/abstractions.js";

export const createFileManagerHooks = (context: AuditLogsContext.Interface) => {
    // Register file event handlers
    context.container.register(AuditLogFileAfterCreateHandler);
    context.container.register(AuditLogFileAfterUpdateHandler);
    context.container.register(AuditLogFileAfterDeleteHandler);

    // Register settings event handlers
    context.container.register(AuditLogSettingsAfterUpdateHandler);
};
