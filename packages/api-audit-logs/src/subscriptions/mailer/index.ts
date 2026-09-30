import { AuditLogMailerSettingsAfterSaveHandler } from "./handlers/AuditLogMailerSettingsAfterSaveHandler.js";
import type { Container } from "@webiny/di";

export const createMailerHooks = (container: Container) => {
    // Register mailer settings event handlers
    container.register(AuditLogMailerSettingsAfterSaveHandler);
};
