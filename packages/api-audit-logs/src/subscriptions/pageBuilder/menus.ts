import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onMenuAfterCreateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onMenuAfterCreate.subscribe(async ({ menu }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.MENU.CREATE);

            await createAuditLog("Menu created", menu, menu.slug, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onMenuAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_MENU_CREATE_HOOK"
            });
        }
    });
};

export const onMenuAfterUpdateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onMenuAfterUpdate.subscribe(async ({ menu, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.MENU.UPDATE);

            await createAuditLog(
                "Menu updated",
                { before: original, after: menu },
                menu.slug,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onMenuAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_MENU_UPDATE_HOOK"
            });
        }
    });
};

export const onMenuAfterDeleteHook = (context: AuditLogsContext) => {
    context.pageBuilder.onMenuAfterDelete.subscribe(async ({ menu }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.MENU.DELETE);

            await createAuditLog("Menu deleted", menu, menu.slug, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onMenuAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_MENU_DELETE_HOOK"
            });
        }
    });
};
