import WebinyError from "@webiny/error";
import { TeamAfterCreateEventHandler } from "@webiny/api-core/features/security/teams/CreateTeam/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogTeamAfterCreateHandlerImpl implements TeamAfterCreateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: TeamAfterCreateEventHandler.Event): Promise<void> {
        try {
            const { team } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.SECURITY.TEAM.CREATE,
                message: "Team created",
                content: team,
                entityId: team.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
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
    dependencies: [RecordAuditLogUseCase]
});
