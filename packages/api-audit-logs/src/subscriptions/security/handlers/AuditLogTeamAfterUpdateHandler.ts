import WebinyError from "@webiny/error";
import { TeamAfterUpdateEventHandler } from "@webiny/api-core/features/security/teams/UpdateTeam/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogTeamAfterUpdateHandlerImpl implements TeamAfterUpdateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: TeamAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { updated, original } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.SECURITY.TEAM.UPDATE,
                message: "Team updated",
                content: { before: original, after: updated },
                entityId: updated.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
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
    dependencies: [RecordAuditLogUseCase]
});
