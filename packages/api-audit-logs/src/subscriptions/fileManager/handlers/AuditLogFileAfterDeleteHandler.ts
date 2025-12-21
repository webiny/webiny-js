import WebinyError from "@webiny/error";
import { FileAfterDeleteHandler } from "@webiny/api-file-manager/features/file/DeleteFile/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogFileAfterDeleteHandlerImpl implements FileAfterDeleteHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: FileAfterDeleteHandler.Event): Promise<void> {
        try {
            const { file } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.DELETE);

            await createAuditLog("File deleted", file, file.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogFileAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_FILE_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogFileAfterDeleteHandler = FileAfterDeleteHandler.createImplementation({
    implementation: AuditLogFileAfterDeleteHandlerImpl,
    dependencies: [AuditLogsContext]
});
