import WebinyError from "@webiny/error";
import { TeamAfterDeleteHandler } from "@webiny/api-core/features/DeleteTeam";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogTeamAfterDeleteHandler implements TeamAfterDeleteHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: TeamAfterDeleteHandler.Event): Promise<void> {
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
