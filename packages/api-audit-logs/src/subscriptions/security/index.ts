import { AuditLogGroupAfterCreateHandler } from "./handlers/AuditLogGroupAfterCreateHandler.js";
import { AuditLogGroupAfterUpdateHandler } from "./handlers/AuditLogGroupAfterUpdateHandler.js";
import { AuditLogGroupAfterDeleteHandler } from "./handlers/AuditLogGroupAfterDeleteHandler.js";
import { AuditLogTeamAfterCreateHandler } from "./handlers/AuditLogTeamAfterCreateHandler.js";
import { AuditLogTeamAfterUpdateHandler } from "./handlers/AuditLogTeamAfterUpdateHandler.js";
import { AuditLogTeamAfterDeleteHandler } from "./handlers/AuditLogTeamAfterDeleteHandler.js";
import { AuditLogUserAfterCreateHandler } from "./handlers/AuditLogUserAfterCreateHandler.js";
import { AuditLogUserAfterUpdateHandler } from "./handlers/AuditLogUserAfterUpdateHandler.js";
import { AuditLogUserAfterDeleteHandler } from "./handlers/AuditLogUserAfterDeleteHandler.js";
import { AuditLogApiKeyAfterCreateHandler } from "./handlers/AuditLogApiKeyAfterCreateHandler.js";
import { AuditLogApiKeyAfterUpdateHandler } from "./handlers/AuditLogApiKeyAfterUpdateHandler.js";
import { AuditLogApiKeyAfterDeleteHandler } from "./handlers/AuditLogApiKeyAfterDeleteHandler.js";
import { AuditLogsContext } from "~/abstractions.js";

export const createSecurityHooks = (context: AuditLogsContext.Interface) => {
    // Register group (role) event handlers
    context.container.register(AuditLogGroupAfterCreateHandler);
    context.container.register(AuditLogGroupAfterUpdateHandler);
    context.container.register(AuditLogGroupAfterDeleteHandler);

    // Register team event handlers
    context.container.register(AuditLogTeamAfterCreateHandler);
    context.container.register(AuditLogTeamAfterUpdateHandler);
    context.container.register(AuditLogTeamAfterDeleteHandler);

    // Register user event handlers
    context.container.register(AuditLogUserAfterCreateHandler);
    context.container.register(AuditLogUserAfterUpdateHandler);
    context.container.register(AuditLogUserAfterDeleteHandler);

    // Register API key event handlers
    context.container.register(AuditLogApiKeyAfterCreateHandler);
    context.container.register(AuditLogApiKeyAfterUpdateHandler);
    context.container.register(AuditLogApiKeyAfterDeleteHandler);
};
