import type { AuditLogsContext } from "~/types.js";
import { AuditLogEntryAfterCreateEventHandler } from "./handlers/AuditLogEntryAfterCreateEventHandler.js";
import { AuditLogEntryAfterUpdateEventHandler } from "./handlers/AuditLogEntryAfterUpdateEventHandler.js";
import { AuditLogEntryAfterDeleteEventHandler } from "./handlers/AuditLogEntryAfterDeleteEventHandler.js";
import { AuditLogEntryAfterPublishEventHandler } from "./handlers/AuditLogEntryAfterPublishEventHandler.js";
import { AuditLogEntryAfterUnpublishEventHandler } from "./handlers/AuditLogEntryAfterUnpublishEventHandler.js";
import { AuditLogEntryAfterRestoreFromBinEventHandler } from "./handlers/AuditLogEntryAfterRestoreFromBinEventHandler.js";
import { AuditLogEntryRevisionAfterCreateEventHandler } from "./handlers/AuditLogEntryRevisionAfterCreateEventHandler.js";
import { AuditLogEntryRevisionAfterDeleteEventHandler } from "./handlers/AuditLogEntryRevisionAfterDeleteEventHandler.js";
import { AuditLogModelAfterCreateEventHandler } from "./handlers/AuditLogModelAfterCreateEventHandler.js";
import { AuditLogModelAfterUpdateEventHandler } from "./handlers/AuditLogModelAfterUpdateEventHandler.js";
import { AuditLogModelAfterDeleteEventHandler } from "./handlers/AuditLogModelAfterDeleteEventHandler.js";
import { AuditLogGroupAfterCreateEventHandler } from "./handlers/AuditLogGroupAfterCreateEventHandler.js";
import { AuditLogGroupAfterUpdateEventHandler } from "./handlers/AuditLogGroupAfterUpdateEventHandler.js";
import { AuditLogGroupAfterDeleteEventHandler } from "./handlers/AuditLogGroupAfterDeleteEventHandler.js";

export const createHeadlessCmsHooks = (context: AuditLogsContext) => {
    // Register entry handlers
    context.container.register(AuditLogEntryAfterCreateEventHandler);
    context.container.register(AuditLogEntryAfterUpdateEventHandler);
    context.container.register(AuditLogEntryAfterDeleteEventHandler);
    context.container.register(AuditLogEntryAfterPublishEventHandler);
    context.container.register(AuditLogEntryAfterUnpublishEventHandler);
    context.container.register(AuditLogEntryAfterRestoreFromBinEventHandler);
    context.container.register(AuditLogEntryRevisionAfterCreateEventHandler);
    context.container.register(AuditLogEntryRevisionAfterDeleteEventHandler);

    // Register model handlers
    context.container.register(AuditLogModelAfterCreateEventHandler);
    context.container.register(AuditLogModelAfterUpdateEventHandler);
    context.container.register(AuditLogModelAfterDeleteEventHandler);

    // Register group handlers
    context.container.register(AuditLogGroupAfterCreateEventHandler);
    context.container.register(AuditLogGroupAfterUpdateEventHandler);
    context.container.register(AuditLogGroupAfterDeleteEventHandler);
};
