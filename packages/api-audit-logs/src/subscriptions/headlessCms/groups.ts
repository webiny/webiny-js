import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onGroupAfterCreateHook = (context: AuditLogsContext) => {
    context.cms.onGroupAfterCreate.subscribe(async ({ group }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.GROUP.CREATE);

            await createAuditLog("Group created", group, group.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onGroupAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_GROUP_CREATE_HOOK"
            });
        }
    });
};

export const onGroupAfterUpdateHook = (context: AuditLogsContext) => {
    context.cms.onGroupAfterUpdate.subscribe(async ({ group, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.GROUP.UPDATE);

            await createAuditLog(
                "Group updated",
                { before: original, after: group },
                group.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onGroupAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_GROUP_UPDATE_HOOK"
            });
        }
    });
};

export const onGroupAfterDeleteHook = (context: AuditLogsContext) => {
    context.cms.onGroupAfterDelete.subscribe(async ({ group }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.GROUP.DELETE);

            await createAuditLog("Group deleted", group, group.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onGroupAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_GROUP_DELETE_HOOK"
            });
        }
    });
};
