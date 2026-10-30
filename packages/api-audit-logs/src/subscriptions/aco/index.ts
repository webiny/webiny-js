import type { Container } from "@webiny/di";
import { AuditLogFolderAfterCreateHandler } from "./handlers/AuditLogFolderAfterCreateHandler.js";
import { AuditLogFolderAfterUpdateHandler } from "./handlers/AuditLogFolderAfterUpdateHandler.js";
import { AuditLogFolderAfterDeleteHandler } from "./handlers/AuditLogFolderAfterDeleteHandler.js";

export const createAcoHooks = (container: Container) => {
    container.register(AuditLogFolderAfterCreateHandler);
    container.register(AuditLogFolderAfterUpdateHandler);
    container.register(AuditLogFolderAfterDeleteHandler);
};
