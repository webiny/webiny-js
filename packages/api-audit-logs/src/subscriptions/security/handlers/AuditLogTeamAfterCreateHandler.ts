import WebinyError from "@webiny/error";
import { TeamAfterCreateEventHandler } from "@webiny/api-core/features/security/teams/CreateTeam/index.js";
import { AuditLogRecorder } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogTeamAfterCreateHandlerImpl implements TeamAfterCreateEventHandler.Interface {
    constructor(private recorder: AuditLogRecorder.Interface) {}

    async handle(event: TeamAfterCreateEventHandler.Event): Promise<void> {
        try {
            const { team } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.TEAM.CREATE);

            await createAuditLog("Team created", team, team.id, this.recorder);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogTeamAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_TEAM_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogTeamAfterCreateHandler = TeamAfterCreateEventHandler.createImplementation({
    implementation: AuditLogTeamAfterCreateHandlerImpl,
    dependencies: [AuditLogRecorder]
});
