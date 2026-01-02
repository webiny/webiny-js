import type { AuditLogsContext } from "~/types.js";
import { AuditLogEntryAfterCreateHandler } from "./handlers/AuditLogEntryAfterCreateHandler.js";
import { AuditLogEntryAfterUpdateHandler } from "./handlers/AuditLogEntryAfterUpdateHandler.js";
import { AuditLogEntryAfterDeleteHandler } from "./handlers/AuditLogEntryAfterDeleteHandler.js";
import { AuditLogEntryAfterPublishHandler } from "./handlers/AuditLogEntryAfterPublishHandler.js";
import { AuditLogEntryAfterUnpublishHandler } from "./handlers/AuditLogEntryAfterUnpublishHandler.js";
import { AuditLogEntryAfterRestoreFromBinHandler } from "./handlers/AuditLogEntryAfterRestoreFromBinHandler.js";
import { AuditLogEntryRevisionAfterCreateHandler } from "./handlers/AuditLogEntryRevisionAfterCreateHandler.js";
import { AuditLogEntryRevisionAfterDeleteHandler } from "./handlers/AuditLogEntryRevisionAfterDeleteHandler.js";
import { AuditLogModelAfterCreateHandler } from "./handlers/AuditLogModelAfterCreateHandler.js";
import { AuditLogModelAfterUpdateHandler } from "./handlers/AuditLogModelAfterUpdateHandler.js";
import { AuditLogModelAfterDeleteHandler } from "./handlers/AuditLogModelAfterDeleteHandler.js";
import { AuditLogGroupAfterCreateHandler } from "./handlers/AuditLogGroupAfterCreateHandler.js";
import { AuditLogGroupAfterUpdateHandler } from "./handlers/AuditLogGroupAfterUpdateHandler.js";
import { AuditLogGroupAfterDeleteHandler } from "./handlers/AuditLogGroupAfterDeleteHandler.js";

export const createHeadlessCmsHooks = (context: AuditLogsContext) => {
    // Register entry handlers
    context.container.register(AuditLogEntryAfterCreateHandler);
    context.container.register(AuditLogEntryAfterUpdateHandler);
    context.container.register(AuditLogEntryAfterDeleteHandler);
    context.container.register(AuditLogEntryAfterPublishHandler);
    context.container.register(AuditLogEntryAfterUnpublishHandler);
    context.container.register(AuditLogEntryAfterRestoreFromBinHandler);
    context.container.register(AuditLogEntryRevisionAfterCreateHandler);
    context.container.register(AuditLogEntryRevisionAfterDeleteHandler);

    // Register model handlers
    context.container.register(AuditLogModelAfterCreateHandler);
    context.container.register(AuditLogModelAfterUpdateHandler);
    context.container.register(AuditLogModelAfterDeleteHandler);

    // Register group handlers
    context.container.register(AuditLogGroupAfterCreateHandler);
    context.container.register(AuditLogGroupAfterUpdateHandler);
    context.container.register(AuditLogGroupAfterDeleteHandler);
};
