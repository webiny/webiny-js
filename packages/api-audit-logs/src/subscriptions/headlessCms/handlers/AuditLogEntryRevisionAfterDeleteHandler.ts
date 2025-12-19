import WebinyError from "@webiny/error";
import { EntryRevisionAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogEntryRevisionAfterDeleteHandlerImpl
    implements EntryRevisionAfterDeleteHandler.Interface
{
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: EntryRevisionAfterDeleteHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.DELETE);

            await createAuditLog("Entry revision deleted", entry, entry.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryRevisionAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogEntryRevisionAfterDeleteHandler =
    EntryRevisionAfterDeleteHandler.createImplementation({
        implementation: AuditLogEntryRevisionAfterDeleteHandlerImpl,
        dependencies: [AuditLogsContext]
    });
