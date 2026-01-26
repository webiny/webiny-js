import WebinyError from "@webiny/error";
import { EntryAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogEntryAfterDeleteHandlerImpl implements EntryAfterDeleteHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: EntryAfterDeleteHandler.Event): Promise<void> {
        const { model, entry, permanent } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            if (permanent) {
                const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.DELETE);
                await createAuditLog("Entry deleted", entry, entry.entryId, this.context);
            } else {
                const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.MOVE_TO_TRASH);
                await createAuditLog("Entry moved to trash", entry, entry.entryId, this.context);
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogEntryAfterDeleteEventHandler = EntryAfterDeleteHandler.createImplementation({
    implementation: AuditLogEntryAfterDeleteHandlerImpl,
    dependencies: [AuditLogsContext]
});
