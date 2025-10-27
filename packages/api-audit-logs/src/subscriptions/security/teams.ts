import { TeamAfterCreateHandler } from "@webiny/api-security/features/teams/CreateTeam";
import { TeamAfterUpdateHandler } from "@webiny/api-security/features/teams/UpdateTeam";
import { TeamAfterDeleteHandler } from "@webiny/api-security/features/teams/DeleteTeam";
import { AuditLogTeamAfterCreateHandler } from "./handlers/AuditLogTeamAfterCreateHandler.js";
import { AuditLogTeamAfterUpdateHandler } from "./handlers/AuditLogTeamAfterUpdateHandler.js";
import { AuditLogTeamAfterDeleteHandler } from "./handlers/AuditLogTeamAfterDeleteHandler.js";
import type { AuditLogsContext } from "~/types.js";

export const createTeamHooks = (context: AuditLogsContext) => {
    context.container.registerFactory(
        TeamAfterCreateHandler,
        () => new AuditLogTeamAfterCreateHandler(context)
    );

    context.container.registerFactory(
        TeamAfterUpdateHandler,
        () => new AuditLogTeamAfterUpdateHandler(context)
    );

    context.container.registerFactory(
        TeamAfterDeleteHandler,
        () => new AuditLogTeamAfterDeleteHandler(context)
    );
};
