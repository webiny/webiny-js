import WebinyError from "@webiny/error";
import { FileAfterDeleteEventHandler } from "@webiny/api-file-manager/features/file/DeleteFile/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogFileAfterDeleteHandlerImpl implements FileAfterDeleteEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: FileAfterDeleteEventHandler.Event): Promise<void> {
        try {
            const { file } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.FILE_MANAGER.FILE.DELETE,
                message: "File deleted",
                content: file,
                entityId: file.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
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
    dependencies: [RecordAuditLogUseCase]
});
