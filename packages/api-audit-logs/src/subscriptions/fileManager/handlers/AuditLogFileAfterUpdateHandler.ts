import WebinyError from "@webiny/error";
import { FileAfterUpdateEventHandler } from "@webiny/api-file-manager/features/file/UpdateFile/index.js";
import { AuditLogRecorder } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogFileAfterUpdateHandlerImpl implements FileAfterUpdateEventHandler.Interface {
    constructor(private recorder: AuditLogRecorder.Interface) {}

    async handle(event: FileAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { file, original } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.UPDATE);

            await createAuditLog(
                "File updated",
                { before: original, after: file },
                file.id,
                this.recorder
            );
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
    dependencies: [AuditLogRecorder]
});
