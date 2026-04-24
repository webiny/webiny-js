import WebinyError from "@webiny/error";
import { EntryRevisionAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogEntryRevisionAfterCreateHandlerImpl
    implements EntryRevisionAfterCreateEventHandler.Interface
{
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: EntryRevisionAfterCreateEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.CREATE);

            await createAuditLog("Entry revision created", entry, entry.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryRevisionAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogEntryRevisionAfterCreateEventHandler =
    EntryRevisionAfterCreateEventHandler.createImplementation({
        implementation: AuditLogEntryRevisionAfterCreateHandlerImpl,
        dependencies: [AuditLogsContext]
    });
