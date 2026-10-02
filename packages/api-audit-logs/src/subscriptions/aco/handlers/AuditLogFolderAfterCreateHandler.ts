import WebinyError from "@webiny/error";
import { FolderAfterCreateEventHandler } from "@webiny/api-aco/features/folder/CreateFolder/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogFolderAfterCreateHandlerImpl implements FolderAfterCreateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: FolderAfterCreateEventHandler.Event): Promise<void> {
        try {
            const { folder } = event.payload;
            if (folder.type === "FmFile") {
                const recordResult = await this.recordAuditLog.execute({
                    audit: AUDIT.FILE_MANAGER.FILE_FOLDER.CREATE,
                    message: "Folder created",
                    content: folder,
                    entityId: folder.id
                });
                if (recordResult.isFail()) {
                    throw recordResult.error;
                }
            } else if (folder.type.startsWith("cms:")) {
                const recordResult = await this.recordAuditLog.execute({
                    audit: AUDIT.HEADLESS_CMS.MODEL_FOLDER.CREATE,
                    message: "Folder created",
                    content: folder,
                    entityId: folder.id
                });
                if (recordResult.isFail()) {
                    throw recordResult.error;
                }
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
    dependencies: [RecordAuditLogUseCase]
});
