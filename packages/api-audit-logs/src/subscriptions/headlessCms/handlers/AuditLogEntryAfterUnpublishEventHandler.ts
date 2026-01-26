import WebinyError from "@webiny/error";
import { EntryAfterUnpublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogEntryAfterUnpublishEventHandlerImpl
    implements EntryAfterUnpublishEventHandler.Interface
{
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: EntryAfterUnpublishEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.UNPUBLISH);

            await createAuditLog("Entry revision unpublished", entry, entry.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryAfterUnpublishEventHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_UNPUBLISH_HANDLER"
            });
        }
    }
}

export const AuditLogEntryAfterUnpublishEventHandler =
    EntryAfterUnpublishEventHandler.createImplementation({
        implementation: AuditLogEntryAfterUnpublishEventHandlerImpl,
        dependencies: [AuditLogsContext]
    });
