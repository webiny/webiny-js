import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onFileAfterCreateHook = (context: AuditLogsContext) => {
    context.fileManager.onFileAfterCreate.subscribe(async ({ file }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.CREATE);

            await createAuditLog("File created", file, file.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFileAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_FILE_CREATE_HOOK"
            });
        }
    });
};

export const onFileAfterUpdateHook = (context: AuditLogsContext) => {
    context.fileManager.onFileAfterUpdate.subscribe(async ({ file, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.UPDATE);

            await createAuditLog(
                "File updated",
                { before: original, after: file },
                file.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFileAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_FILE_UPDATE_HOOK"
            });
        }
    });
};

export const onFileAfterDeleteHook = (context: AuditLogsContext) => {
    context.fileManager.onFileAfterDelete.subscribe(async ({ file }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.DELETE);

            await createAuditLog("File deleted", file, file.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFileAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_FILE_DELETE_HOOK"
            });
        }
    });
};
