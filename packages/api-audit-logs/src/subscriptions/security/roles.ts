import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onRoleAfterCreateHook = (context: AuditLogsContext) => {
    context.security.onGroupAfterCreate.subscribe(async ({ group }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.ROLE.CREATE);

            await createAuditLog("Role created", group, group.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onRoleAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_ROLE_CREATE_HOOK"
            });
        }
    });
};

export const onRoleAfterUpdateHook = (context: AuditLogsContext) => {
    context.security.onGroupAfterUpdate.subscribe(async ({ group, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.ROLE.UPDATE);

            await createAuditLog(
                "Role updated",
                { before: original, after: group },
                group.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onRoleAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_ROLE_UPDATE_HOOK"
            });
        }
    });
};

export const onRoleAfterDeleteHook = (context: AuditLogsContext) => {
    context.security.onGroupAfterDelete.subscribe(async ({ group }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.ROLE.DELETE);

            await createAuditLog("Role deleted", group, group.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onRoleAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_ROLE_DELETE_HOOK"
            });
        }
    });
};
