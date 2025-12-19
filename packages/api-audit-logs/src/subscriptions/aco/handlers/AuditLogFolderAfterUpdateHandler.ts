import WebinyError from "@webiny/error";
import { FolderAfterUpdateHandler } from "@webiny/api-aco/features/folder/UpdateFolder/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogFolderAfterUpdateHandlerImpl implements FolderAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: FolderAfterUpdateHandler.Event): Promise<void> {
        try {
            const { folder, original } = event.payload;
            if (folder.type === "FmFile") {
                const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE_FOLDER.UPDATE);
                await createAuditLog(
                    "Folder updated",
                    { before: original, after: folder },
                    folder.id,
                    this.context
                );
            } else if (folder.type.startsWith("cms:")) {
                const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL_FOLDER.UPDATE);
                await createAuditLog(
                    "Folder updated",
                    { before: original, after: folder },
                    folder.id,
                    this.context
                );
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogFolderAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_FOLDER_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogFolderAfterUpdateHandler = FolderAfterUpdateHandler.createImplementation({
    implementation: AuditLogFolderAfterUpdateHandlerImpl,
    dependencies: [AuditLogsContext]
});
