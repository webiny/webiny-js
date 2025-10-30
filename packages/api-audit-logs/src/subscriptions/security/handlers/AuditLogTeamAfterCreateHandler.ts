import WebinyError from "@webiny/error";
import { TeamAfterCreateHandler } from "@webiny/api-core/features/CreateTeam";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogTeamAfterCreateHandler implements TeamAfterCreateHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: TeamAfterCreateHandler.Event): Promise<void> {
        try {
            const { team } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.TEAM.CREATE);

            await createAuditLog("Team created", team, team.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogTeamAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_TEAM_CREATE_HANDLER"
            });
        }
    }
}
