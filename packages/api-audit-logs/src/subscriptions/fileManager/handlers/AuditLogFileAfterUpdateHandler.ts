import WebinyError from "@webiny/error";
import { FileAfterUpdateEventHandler } from "@webiny/api-file-manager/features/file/UpdateFile/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogFileAfterUpdateHandlerImpl implements FileAfterUpdateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: FileAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { file, original } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.FILE_MANAGER.FILE.UPDATE,
                message: "File updated",
                content: { before: original, after: file },
                entityId: file.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogFileAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_FILE_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogFileAfterUpdateHandler = FileAfterUpdateEventHandler.createImplementation({
    implementation: AuditLogFileAfterUpdateHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
