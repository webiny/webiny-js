import type { AuditLogsContext } from "~/types.js";
import { AuditLogFolderAfterCreateHandler } from "./handlers/AuditLogFolderAfterCreateHandler.js";
import { AuditLogFolderAfterUpdateHandler } from "./handlers/AuditLogFolderAfterUpdateHandler.js";
import { AuditLogFolderAfterDeleteHandler } from "./handlers/AuditLogFolderAfterDeleteHandler.js";

export const createAcoHooks = (context: AuditLogsContext) => {
    context.container.register(AuditLogFolderAfterCreateHandler);
    context.container.register(AuditLogFolderAfterUpdateHandler);
    context.container.register(AuditLogFolderAfterDeleteHandler);
};
