import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onPageAfterCreateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageAfterCreate.subscribe(async ({ page }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE.CREATE);

            await createAuditLog("Page created", page, page.pid, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_PAGE_CREATE_HOOK"
            });
        }
    });
};

export const onPagesAfterExportHook = (context: AuditLogsContext) => {
    context.pageBuilder.pages.onPagesAfterExport.subscribe(async ({ params }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE.EXPORT);

            await createAuditLog("Pages exported", params, "-", context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPagesAfterExportHook hook",
                code: "AUDIT_LOGS_PAGES_EXPORT_HOOK"
            });
        }
    });
};

export const onPagesAfterImportHook = (context: AuditLogsContext) => {
    context.pageBuilder.pages.onPagesAfterImport.subscribe(async ({ params }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE.IMPORT);

            await createAuditLog("Pages imported", params, "-", context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPagesAfterImportHook hook",
                code: "AUDIT_LOGS_PAGES_IMPORT_HOOK"
            });
        }
    });
};
