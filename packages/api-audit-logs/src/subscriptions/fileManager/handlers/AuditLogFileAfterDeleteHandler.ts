import WebinyError from "@webiny/error";
import { FileAfterDeleteEventHandler } from "@webiny/api-file-manager/features/file/DeleteFile/index.js";
import { AuditLogRecorder } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogFileAfterDeleteHandlerImpl implements FileAfterDeleteEventHandler.Interface {
    constructor(private recorder: AuditLogRecorder.Interface) {}

    async handle(event: FileAfterDeleteEventHandler.Event): Promise<void> {
        try {
            const { file } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.DELETE);

            await createAuditLog("File deleted", file, file.id, this.recorder);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogFileAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_FILE_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogFileAfterDeleteHandler = FileAfterDeleteEventHandler.createImplementation({
    implementation: AuditLogFileAfterDeleteHandlerImpl,
    dependencies: [AuditLogRecorder]
});
