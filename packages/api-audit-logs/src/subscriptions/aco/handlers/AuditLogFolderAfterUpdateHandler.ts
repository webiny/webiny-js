import WebinyError from "@webiny/error";
import type { DomainEvent } from "@webiny/api-core";
import {
    FolderAfterUpdateHandler,
    type FolderAfterUpdatePayload
} from "@webiny/api-aco/features/folders/UpdateFolder/abstractions";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogFolderAfterUpdateHandler implements FolderAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: DomainEvent<FolderAfterUpdatePayload>): Promise<void> {
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
