import WebinyError from "@webiny/error";
import { FolderAfterCreateHandler } from "@webiny/api-aco/features/folder/CreateFolder/abstractions";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogFolderAfterCreateHandler implements FolderAfterCreateHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: FolderAfterCreateHandler.Event): Promise<void> {
        try {
            const { folder } = event.payload;
            if (folder.type === "FmFile") {
                const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE_FOLDER.CREATE);
                await createAuditLog("Folder created", folder, folder.id, this.context);
            } else if (folder.type.startsWith("cms:")) {
                const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL_FOLDER.CREATE);
                await createAuditLog("Folder created", folder, folder.id, this.context);
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogFolderAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_FOLDER_CREATE_HANDLER"
            });
        }
    }
}
