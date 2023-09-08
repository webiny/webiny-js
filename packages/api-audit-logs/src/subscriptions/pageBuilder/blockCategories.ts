import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onBlockCategoryAfterCreateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onAfterBlockCategoryCreate.subscribe(async ({ blockCategory }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.BLOCK_CATEGORY.CREATE);

            await createAuditLog(
                "Block category created",
                blockCategory,
                blockCategory.slug,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onBlockCategoryAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_BLOCK_CATEGORY_CREATE_HOOK"
            });
        }
    });
};

export const onBlockCategoryAfterUpdateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onAfterBlockCategoryUpdate.subscribe(
        async ({ blockCategory, original }) => {
            try {
                const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.BLOCK_CATEGORY.UPDATE);

                await createAuditLog(
                    "Block category updated",
                    { before: original, after: blockCategory },
                    blockCategory.slug,
                    context
                );
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while executing onBlockCategoryAfterUpdateHook hook",
                    code: "AUDIT_LOGS_AFTER_BLOCK_CATEGORY_UPDATE_HOOK"
                });
            }
        }
    );
};

export const onBlockCategoryAfterDeleteHook = (context: AuditLogsContext) => {
    context.pageBuilder.onAfterBlockCategoryDelete.subscribe(async ({ blockCategory }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.BLOCK_CATEGORY.DELETE);

            await createAuditLog(
                "Block category deleted",
                blockCategory,
                blockCategory.slug,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onBlockCategoryAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_BLOCK_CATEGORY_DELETE_HOOK"
            });
        }
    });
};
