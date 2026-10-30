import { AuditLogRoleAfterCreateHandler } from "./handlers/AuditLogRoleAfterCreateHandler.js";
import { AuditLogRoleAfterUpdateHandler } from "./handlers/AuditLogRoleAfterUpdateHandler.js";
import { AuditLogRoleAfterDeleteHandler } from "./handlers/AuditLogRoleAfterDeleteHandler.js";
import { AuditLogTeamAfterCreateHandler } from "./handlers/AuditLogTeamAfterCreateHandler.js";
import { AuditLogTeamAfterUpdateHandler } from "./handlers/AuditLogTeamAfterUpdateHandler.js";
import { AuditLogTeamAfterDeleteHandler } from "./handlers/AuditLogTeamAfterDeleteHandler.js";
import { AuditLogUserAfterCreateHandler } from "./handlers/AuditLogUserAfterCreateHandler.js";
import { AuditLogUserAfterUpdateHandler } from "./handlers/AuditLogUserAfterUpdateHandler.js";
import { AuditLogUserAfterDeleteHandler } from "./handlers/AuditLogUserAfterDeleteHandler.js";
import { AuditLogApiKeyAfterCreateHandler } from "./handlers/AuditLogApiKeyAfterCreateHandler.js";
import { AuditLogApiKeyAfterUpdateHandler } from "./handlers/AuditLogApiKeyAfterUpdateHandler.js";
import { AuditLogApiKeyAfterDeleteHandler } from "./handlers/AuditLogApiKeyAfterDeleteHandler.js";
import type { Container } from "@webiny/di";

export const createSecurityHooks = (container: Container) => {
    // Register group (role) event handlers
    container.register(AuditLogRoleAfterCreateHandler);
    container.register(AuditLogRoleAfterUpdateHandler);
    container.register(AuditLogRoleAfterDeleteHandler);

    // Register team event handlers
    container.register(AuditLogTeamAfterCreateHandler);
    container.register(AuditLogTeamAfterUpdateHandler);
    container.register(AuditLogTeamAfterDeleteHandler);

    // Register user event handlers
    container.register(AuditLogUserAfterCreateHandler);
    container.register(AuditLogUserAfterUpdateHandler);
    container.register(AuditLogUserAfterDeleteHandler);

    // Register API key event handlers
    container.register(AuditLogApiKeyAfterCreateHandler);
    container.register(AuditLogApiKeyAfterUpdateHandler);
    container.register(AuditLogApiKeyAfterDeleteHandler);
};
