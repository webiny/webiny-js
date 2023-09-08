import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onFolderAfterCreateHook = (context: AuditLogsContext) => {
    context.aco.folder.onFolderAfterCreate.subscribe(async ({ folder }) => {
        try {
            if (folder.type === "PbPage") {
                const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE_FOLDER.CREATE);
                await createAuditLog("Folder created", folder, folder.id, context);
            } else if (folder.type === "FmFile") {
                const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE_FOLDER.CREATE);
                await createAuditLog("Folder created", folder, folder.id, context);
            } else if (folder.type.startsWith("cms:")) {
                const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL_FOLDER.CREATE);
                await createAuditLog("Folder created", folder, folder.id, context);
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFolderAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_FOLDER_CREATE_HOOK"
            });
        }
    });
};

export const onFolderAfterUpdateHook = (context: AuditLogsContext) => {
    context.aco.folder.onFolderAfterUpdate.subscribe(async ({ folder, original }) => {
        try {
            if (folder.type === "PbPage") {
                const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE_FOLDER.UPDATE);
                await createAuditLog(
                    "Folder updated",
                    { before: original, after: folder },
                    folder.id,
                    context
                );
            } else if (folder.type === "FmFile") {
                const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE_FOLDER.UPDATE);
                await createAuditLog(
                    "Folder updated",
                    { before: original, after: folder },
                    folder.id,
                    context
                );
            } else if (folder.type.startsWith("cms:")) {
                const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL_FOLDER.UPDATE);
                await createAuditLog(
                    "Folder updated",
                    { before: original, after: folder },
                    folder.id,
                    context
                );
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFolderAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_FOLDER_UPDATE_HOOK"
            });
        }
    });
};

export const onFolderAfterDeleteHook = (context: AuditLogsContext) => {
    context.aco.folder.onFolderAfterDelete.subscribe(async ({ folder }) => {
        try {
            if (folder.type === "PbPage") {
                const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE_FOLDER.DELETE);
                await createAuditLog("Folder deleted", folder, folder.id, context);
            } else if (folder.type === "FmFile") {
                const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE_FOLDER.DELETE);
                await createAuditLog("Folder deleted", folder, folder.id, context);
            } else if (folder.type.startsWith("cms:")) {
                const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL_FOLDER.DELETE);
                await createAuditLog("Folder deleted", folder, folder.id, context);
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFolderAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_FOLDER_DELETE_HOOK"
            });
        }
    });
};
