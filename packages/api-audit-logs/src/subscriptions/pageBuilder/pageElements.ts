import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onPageElementAfterCreateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageElementAfterCreate.subscribe(async ({ pageElement }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE_ELEMENT.CREATE);

            await createAuditLog("Page element created", pageElement, pageElement.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageElementAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_PAGE_ELEMENT_CREATE_HOOK"
            });
        }
    });
};

export const onPageElementAfterUpdateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageElementAfterUpdate.subscribe(async ({ pageElement, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE_ELEMENT.UPDATE);

            await createAuditLog(
                "Page element updated",
                { before: original, after: pageElement },
                pageElement.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageElementAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_PAGE_ELEMENT_UPDATE_HOOK"
            });
        }
    });
};

export const onPageElementAfterDeleteHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageElementAfterDelete.subscribe(async ({ pageElement }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE_ELEMENT.DELETE);

            await createAuditLog("Page element deleted", pageElement, pageElement.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageElementAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_PAGE_ELEMENT_DELETE_HOOK"
            });
        }
    });
};
