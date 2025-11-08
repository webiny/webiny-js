import WebinyError from "@webiny/error";
import { TeamAfterUpdateHandler } from "@webiny/api-core/features/UpdateTeam";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogTeamAfterUpdateHandler implements TeamAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: TeamAfterUpdateHandler.Event): Promise<void> {
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
