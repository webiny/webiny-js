import { createApiKeyHooks } from "./apiKeys.js";
import { createRoleHooks } from "./roles.js";
import { createTeamHooks } from "./teams.js";
import { createUserHooks } from "./users.js";
import type { AuditLogsContext } from "~/types.js";

export const createSecurityHooks = (context: AuditLogsContext) => {
    createApiKeyHooks(context);
    createRoleHooks(context);
    createTeamHooks(context);
    createUserHooks(context);
};
