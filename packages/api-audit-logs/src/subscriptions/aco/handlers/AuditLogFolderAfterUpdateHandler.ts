import WebinyError from "@webiny/error";
import { FolderAfterUpdateEventHandler } from "@webiny/api-aco/features/folder/UpdateFolder/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogFolderAfterUpdateHandlerImpl implements FolderAfterUpdateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: FolderAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { folder, original } = event.payload;
            if (folder.type === "FmFile") {
                const recordResult = await this.recordAuditLog.execute({
                    audit: AUDIT.FILE_MANAGER.FILE_FOLDER.UPDATE,
                    message: "Folder updated",
                    content: { before: original, after: folder },
                    entityId: folder.id
                });
                if (recordResult.isFail()) {
                    throw recordResult.error;
                }
            } else if (folder.type.startsWith("cms:")) {
                const recordResult = await this.recordAuditLog.execute({
                    audit: AUDIT.HEADLESS_CMS.MODEL_FOLDER.UPDATE,
                    message: "Folder updated",
                    content: { before: original, after: folder },
                    entityId: folder.id
                });
                if (recordResult.isFail()) {
                    throw recordResult.error;
                }
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogFolderAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_FOLDER_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogFolderAfterUpdateHandler = FolderAfterUpdateEventHandler.createImplementation({
    implementation: AuditLogFolderAfterUpdateHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
