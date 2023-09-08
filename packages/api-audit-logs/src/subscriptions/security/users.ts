import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onUserAfterCreateHook = (context: AuditLogsContext) => {
    context.adminUsers.onUserAfterCreate.subscribe(async ({ user }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.USER.CREATE);

            await createAuditLog("User created", user, user.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onUserAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_USER_CREATE_HOOK"
            });
        }
    });
};

export const onUserAfterUpdateHook = (context: AuditLogsContext) => {
    context.adminUsers.onUserAfterUpdate.subscribe(async ({ updatedUser, originalUser }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.USER.UPDATE);

            await createAuditLog(
                "User updated",
                { before: originalUser, after: updatedUser },
                updatedUser.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onUserAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_USER_UPDATE_HOOK"
            });
        }
    });
};

export const onUserAfterDeleteHook = (context: AuditLogsContext) => {
    context.adminUsers.onUserAfterDelete.subscribe(async ({ user }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.USER.DELETE);

            await createAuditLog("User deleted", user, user.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onUserAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_USER_DELETE_HOOK"
            });
        }
    });
};
