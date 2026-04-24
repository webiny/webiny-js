import WebinyError from "@webiny/error";
import { TeamAfterUpdateEventHandler } from "@webiny/api-core/features/security/teams/UpdateTeam/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogTeamAfterUpdateHandlerImpl implements TeamAfterUpdateEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: TeamAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { updated, original } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.TEAM.UPDATE);

            await createAuditLog(
                "Team updated",
                { before: original, after: updated },
                updated.id,
                this.context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogTeamAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_TEAM_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogTeamAfterUpdateHandler = TeamAfterUpdateEventHandler.createImplementation({
    implementation: AuditLogTeamAfterUpdateHandlerImpl,
    dependencies: [AuditLogsContext]
});
