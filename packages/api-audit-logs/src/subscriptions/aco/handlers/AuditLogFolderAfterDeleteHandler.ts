import WebinyError from "@webiny/error";
import { FolderAfterDeleteEventHandler } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogFolderAfterDeleteHandlerImpl implements FolderAfterDeleteEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: FolderAfterDeleteEventHandler.Event): Promise<void> {
        try {
            const { folder } = event.payload;
            if (folder.type === "PbPage") {
                const recordResult = await this.recordAuditLog.execute({
                    audit: AUDIT.PAGE_BUILDER.PAGE_FOLDER.DELETE,
                    message: "Folder deleted",
                    content: folder,
                    entityId: folder.id
                });
                if (recordResult.isFail()) {
                    throw recordResult.error;
                }
            } else if (folder.type === "FmFile") {
                const recordResult = await this.recordAuditLog.execute({
                    audit: AUDIT.FILE_MANAGER.FILE_FOLDER.DELETE,
                    message: "Folder deleted",
                    content: folder,
                    entityId: folder.id
                });
                if (recordResult.isFail()) {
                    throw recordResult.error;
                }
            } else if (folder.type.startsWith("cms:")) {
                const recordResult = await this.recordAuditLog.execute({
                    audit: AUDIT.HEADLESS_CMS.MODEL_FOLDER.DELETE,
                    message: "Folder deleted",
                    content: folder,
                    entityId: folder.id
                });
                if (recordResult.isFail()) {
                    throw recordResult.error;
                }
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogFolderAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_FOLDER_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogFolderAfterDeleteHandler = FolderAfterDeleteEventHandler.createImplementation({
    implementation: AuditLogFolderAfterDeleteHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
