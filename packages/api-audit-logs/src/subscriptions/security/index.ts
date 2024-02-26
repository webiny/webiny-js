import {
    onApiKeyAfterCreateHook,
    onApiKeyAfterUpdateHook,
    onApiKeyAfterDeleteHook
} from "./apiKeys";
import { onRoleAfterCreateHook, onRoleAfterUpdateHook, onRoleAfterDeleteHook } from "./roles";
import { onTeamAfterCreateHook, onTeamAfterUpdateHook, onTeamAfterDeleteHook } from "./teams";
import { onUserAfterCreateHook, onUserAfterUpdateHook, onUserAfterDeleteHook } from "./users";

import { AuditLogsContext } from "~/types";

export const createSecurityHooks = (context: AuditLogsContext) => {
    onApiKeyAfterCreateHook(context);
    onApiKeyAfterUpdateHook(context);
    onApiKeyAfterDeleteHook(context);
    onRoleAfterCreateHook(context);
    onRoleAfterUpdateHook(context);
    onRoleAfterDeleteHook(context);
    onTeamAfterCreateHook(context);
    onTeamAfterUpdateHook(context);
    onTeamAfterDeleteHook(context);
    onUserAfterCreateHook(context);
    onUserAfterUpdateHook(context);
    onUserAfterDeleteHook(context);
};
