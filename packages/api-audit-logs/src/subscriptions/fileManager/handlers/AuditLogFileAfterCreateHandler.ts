import WebinyError from "@webiny/error";
import { FileAfterCreateEventHandler } from "@webiny/api-file-manager/features/file/CreateFile/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogFileAfterCreateHandlerImpl implements FileAfterCreateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: FileAfterCreateEventHandler.Event): Promise<void> {
        try {
            const { file } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.FILE_MANAGER.FILE.CREATE,
                message: "File created",
                content: file,
                entityId: file.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogFileAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_FILE_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogFileAfterCreateHandler = FileAfterCreateEventHandler.createImplementation({
    implementation: AuditLogFileAfterCreateHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
