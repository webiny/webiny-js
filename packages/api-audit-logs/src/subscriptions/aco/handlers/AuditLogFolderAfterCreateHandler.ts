import WebinyError from "@webiny/error";
import { FolderAfterCreateEventHandler } from "@webiny/api-aco/features/folder/CreateFolder/index.js";
import { AuditLogRecorder } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogFolderAfterCreateHandlerImpl implements FolderAfterCreateEventHandler.Interface {
    constructor(private recorder: AuditLogRecorder.Interface) {}

    async handle(event: FolderAfterCreateEventHandler.Event): Promise<void> {
        try {
            const { folder } = event.payload;
            if (folder.type === "FmFile") {
                const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE_FOLDER.CREATE);
                await createAuditLog("Folder created", folder, folder.id, this.recorder);
            } else if (folder.type.startsWith("cms:")) {
                const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL_FOLDER.CREATE);
                await createAuditLog("Folder created", folder, folder.id, this.recorder);
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogFolderAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_FOLDER_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogFolderAfterCreateHandler = FolderAfterCreateEventHandler.createImplementation({
    implementation: AuditLogFolderAfterCreateHandlerImpl,
    dependencies: [AuditLogRecorder]
});
