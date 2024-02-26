import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onPageRevisionAfterCreateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageAfterCreateFrom.subscribe(async ({ page }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE_REVISION.CREATE);

            await createAuditLog("Page revision created", page, page.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageRevisionAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_PAGE_REVISION_CREATE_HOOK"
            });
        }
    });
};

export const onPageRevisionAfterUpdateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageAfterUpdate.subscribe(async ({ page, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE_REVISION.UPDATE);

            await await createAuditLog(
                "Page revision updated",
                { before: original, after: page },
                page.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageRevisionAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_PAGE_REVISION_UPDATE_HOOK"
            });
        }
    });
};

export const onPageRevisionAfterDeleteHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageAfterDelete.subscribe(async ({ page }) => {
        try {
            if (page.version === 1) {
                const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE.DELETE);

                await createAuditLog("Page deleted", page, page.pid, context);
            } else {
                const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE_REVISION.DELETE);

                await createAuditLog("Page revision deleted", page, page.id, context);
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageRevisionAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_PAGE_REVISION_DELETE_HOOK"
            });
        }
    });
};

export const onPageRevisionAfterPublishHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageAfterPublish.subscribe(async ({ page }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE_REVISION.PUBLISH);

            await createAuditLog("Page revision published", page, page.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageRevisionAfterPublishHook hook",
                code: "AUDIT_LOGS_AFTER_PAGE_REVISION_PUBLISH_HOOK"
            });
        }
    });
};

export const onPageRevisionAfterUnpublishHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageAfterUnpublish.subscribe(async ({ page }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE_REVISION.UNPUBLISH);

            await createAuditLog("Page revision unpublished", page, page.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageRevisionAfterUnpublishHook hook",
                code: "AUDIT_LOGS_AFTER_PAGE_REVISION_UNPUBLISH_HOOK"
            });
        }
    });
};
