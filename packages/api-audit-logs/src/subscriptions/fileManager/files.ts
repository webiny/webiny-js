import WebinyError from "@webiny/error";

import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";
import { FileAfterCreateHandler } from "@webiny/api-file-manager/features/file/CreateFile/events.js";
import { FileAfterUpdateHandler } from "@webiny/api-file-manager/features/file/UpdateFile/events.js";
import { FileAfterDeleteHandler } from "@webiny/api-file-manager/features/file/DeleteFile/events.js";

export const onFileAfterCreateHook = (context: AuditLogsContext) => {
    context.container.registerInstance(FileAfterCreateHandler, {
        handle: async event => {
            const { file } = event.payload;

            try {
                const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.CREATE);

                await createAuditLog("File created", file, file.id, context);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while executing onFileAfterCreateHook hook",
                    code: "AUDIT_LOGS_AFTER_FILE_CREATE_HOOK"
                });
            }
        }
    });
};

export const onFileAfterUpdateHook = (context: AuditLogsContext) => {
    context.container.registerInstance(FileAfterUpdateHandler, {
        handle: async event => {
            const { file, original } = event.payload;

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
        }
    });
};

export const onFileAfterDeleteHook = (context: AuditLogsContext) => {
    context.container.registerInstance(FileAfterDeleteHandler, {
        handle: async event => {
            const { file } = event.payload;

            try {
                const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.DELETE);

                await createAuditLog("File deleted", file, file.id, context);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while executing onFileAfterDeleteHook hook",
                    code: "AUDIT_LOGS_AFTER_FILE_DELETE_HOOK"
                });
            }
        }
    });
};
