import WebinyError from "@webiny/error";
import { TeamAfterDeleteEventHandler } from "@webiny/api-core/features/security/teams/DeleteTeam/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogTeamAfterDeleteHandlerImpl implements TeamAfterDeleteEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: TeamAfterDeleteEventHandler.Event): Promise<void> {
        try {
            const { team } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.TEAM.DELETE);

            await createAuditLog("Team deleted", team, team.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogTeamAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_TEAM_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogTeamAfterDeleteHandler = TeamAfterDeleteEventHandler.createImplementation({
    implementation: AuditLogTeamAfterDeleteHandlerImpl,
    dependencies: [AuditLogsContext]
});
