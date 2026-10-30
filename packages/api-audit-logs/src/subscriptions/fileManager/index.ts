import { AuditLogFileAfterCreateHandler } from "./handlers/AuditLogFileAfterCreateHandler.js";
import { AuditLogFileAfterUpdateHandler } from "./handlers/AuditLogFileAfterUpdateHandler.js";
import { AuditLogFileAfterDeleteHandler } from "./handlers/AuditLogFileAfterDeleteHandler.js";
import { AuditLogSettingsAfterUpdateHandler } from "./handlers/AuditLogSettingsAfterUpdateHandler.js";
import type { Container } from "@webiny/di";

export const createFileManagerHooks = (container: Container) => {
    // Register file event handlers
    container.register(AuditLogFileAfterCreateHandler);
    container.register(AuditLogFileAfterUpdateHandler);
    container.register(AuditLogFileAfterDeleteHandler);

    // Register settings event handlers
    container.register(AuditLogSettingsAfterUpdateHandler);
};
