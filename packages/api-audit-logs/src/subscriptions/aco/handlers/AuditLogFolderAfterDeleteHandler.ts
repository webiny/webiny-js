import WebinyError from "@webiny/error";
import { FolderAfterDeleteHandler } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogFolderAfterDeleteHandlerImpl implements FolderAfterDeleteHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: FolderAfterDeleteHandler.Event): Promise<void> {
        try {
            const { folder } = event.payload;
            if (folder.type === "PbPage") {
                const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.PAGE_FOLDER.DELETE);
                await createAuditLog("Folder deleted", folder, folder.id, this.context);
            } else if (folder.type === "FmFile") {
                const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE_FOLDER.DELETE);
                await createAuditLog("Folder deleted", folder, folder.id, this.context);
            } else if (folder.type.startsWith("cms:")) {
                const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL_FOLDER.DELETE);
                await createAuditLog("Folder deleted", folder, folder.id, this.context);
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogFolderAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_FOLDER_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogFolderAfterDeleteHandler = FolderAfterDeleteHandler.createImplementation({
    implementation: AuditLogFolderAfterDeleteHandlerImpl,
    dependencies: [AuditLogsContext]
});
