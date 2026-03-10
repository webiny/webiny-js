import WebinyError from "@webiny/error";
import { FileAfterCreateEventHandler } from "@webiny/api-file-manager/features/file/CreateFile/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogFileAfterCreateHandlerImpl implements FileAfterCreateEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: FileAfterCreateEventHandler.Event): Promise<void> {
        try {
            const { file } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.CREATE);

            await createAuditLog("File created", file, file.id, this.context);
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
    dependencies: [AuditLogsContext]
});
