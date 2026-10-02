import WebinyError from "@webiny/error";
import { TeamAfterDeleteEventHandler } from "@webiny/api-core/features/security/teams/DeleteTeam/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogTeamAfterDeleteHandlerImpl implements TeamAfterDeleteEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: TeamAfterDeleteEventHandler.Event): Promise<void> {
        try {
            const { team } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.SECURITY.TEAM.DELETE,
                message: "Team deleted",
                content: team,
                entityId: team.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
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
    dependencies: [RecordAuditLogUseCase]
});
