import type { Container } from "@webiny/di";
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

export const createHeadlessCmsHooks = (container: Container) => {
    // Register entry handlers
    container.register(AuditLogEntryAfterCreateEventHandler);
    container.register(AuditLogEntryAfterUpdateEventHandler);
    container.register(AuditLogEntryAfterDeleteEventHandler);
    container.register(AuditLogEntryAfterPublishEventHandler);
    container.register(AuditLogEntryAfterUnpublishEventHandler);
    container.register(AuditLogEntryAfterRestoreFromBinEventHandler);
    container.register(AuditLogEntryRevisionAfterCreateEventHandler);
    container.register(AuditLogEntryRevisionAfterDeleteEventHandler);

    // Register model handlers
    container.register(AuditLogModelAfterCreateEventHandler);
    container.register(AuditLogModelAfterUpdateEventHandler);
    container.register(AuditLogModelAfterDeleteEventHandler);

    // Register group handlers
    container.register(AuditLogGroupAfterCreateEventHandler);
    container.register(AuditLogGroupAfterUpdateEventHandler);
    container.register(AuditLogGroupAfterDeleteEventHandler);
};
