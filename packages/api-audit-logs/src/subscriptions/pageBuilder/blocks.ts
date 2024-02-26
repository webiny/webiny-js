import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onBlockAfterCreateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageBlockAfterCreate.subscribe(async ({ pageBlock }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.BLOCK.CREATE);

            await createAuditLog("Block created", pageBlock, pageBlock.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onBlockAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_BLOCK_CREATE_HOOK"
            });
        }
    });
};

export const onBlockAfterUpdateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageBlockAfterUpdate.subscribe(async ({ pageBlock, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.BLOCK.UPDATE);

            await createAuditLog(
                "Block updated",
                { before: original, after: pageBlock },
                pageBlock.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onBlockAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_BLOCK_UPDATE_HOOK"
            });
        }
    });
};

export const onBlockAfterDeleteHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageBlockAfterDelete.subscribe(async ({ pageBlock }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.BLOCK.DELETE);

            await createAuditLog("Block deleted", pageBlock, pageBlock.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onBlockAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_BLOCK_DELETE_HOOK"
            });
        }
    });
};

export const onBlocksAfterExportHook = (context: AuditLogsContext) => {
    context.pageBuilder.blocks.onBlocksAfterExport.subscribe(async ({ params }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.BLOCK.EXPORT);

            await createAuditLog("Blocks exported", params, "-", context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onBlocksAfterExportHook hook",
                code: "AUDIT_LOGS_BLOCKS_EXPORT_HOOK"
            });
        }
    });
};

export const onBlocksAfterImportHook = (context: AuditLogsContext) => {
    context.pageBuilder.blocks.onBlocksAfterImport.subscribe(async ({ params }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.BLOCK.IMPORT);

            await createAuditLog("Blocks imported", params, "-", context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onBlocksAfterImportHook hook",
                code: "AUDIT_LOGS_BLOCKS_IMPORT_HOOK"
            });
        }
    });
};
