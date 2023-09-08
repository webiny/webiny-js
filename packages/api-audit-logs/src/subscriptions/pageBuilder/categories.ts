import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onCategoryAfterCreateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onCategoryAfterCreate.subscribe(async ({ category }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.CATEGORY.CREATE);

            await createAuditLog("Category created", category, category.slug, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onCategoryAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_CATEGORY_CREATE_HOOK"
            });
        }
    });
};

export const onCategoryAfterUpdateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onCategoryAfterUpdate.subscribe(async ({ category, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.CATEGORY.UPDATE);

            await createAuditLog(
                "Category updated",
                { before: original, after: category },
                category.slug,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onCategoryAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_CATEGORY_UPDATE_HOOK"
            });
        }
    });
};

export const onCategoryAfterDeleteHook = (context: AuditLogsContext) => {
    context.pageBuilder.onCategoryAfterDelete.subscribe(async ({ category }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.CATEGORY.DELETE);

            await createAuditLog("Category deleted", category, category.slug, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onCategoryAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_CATEGORY_DELETE_HOOK"
            });
        }
    });
};
