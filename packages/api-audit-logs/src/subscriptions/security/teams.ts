import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onTeamAfterCreateHook = (context: AuditLogsContext) => {
    context.security.onTeamAfterCreate.subscribe(async ({ team }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.TEAM.CREATE);

            await createAuditLog("Team created", team, team.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onTeamAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_TEAM_CREATE_HOOK"
            });
        }
    });
};

export const onTeamAfterUpdateHook = (context: AuditLogsContext) => {
    context.security.onTeamAfterUpdate.subscribe(async ({ team, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.TEAM.UPDATE);

            await createAuditLog(
                "Team updated",
                { before: original, after: team },
                team.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onTeamAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_TEAM_UPDATE_HOOK"
            });
        }
    });
};

export const onTeamAfterDeleteHook = (context: AuditLogsContext) => {
    context.security.onTeamAfterDelete.subscribe(async ({ team }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.TEAM.DELETE);

            await createAuditLog("Team deleted", team, team.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onTeamAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_TEAM_DELETE_HOOK"
            });
        }
    });
};
