import WebinyError from "@webiny/error";
import { EntryAfterPublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogEntryAfterPublishEventHandlerImpl implements EntryAfterPublishEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: EntryAfterPublishEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.PUBLISH);

            await createAuditLog("Entry revision published", entry, entry.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryAfterPublishEventHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_PUBLISH_HANDLER"
            });
        }
    }
}

export const AuditLogEntryAfterPublishEventHandler =
    EntryAfterPublishEventHandler.createImplementation({
        implementation: AuditLogEntryAfterPublishEventHandlerImpl,
        dependencies: [AuditLogsContext]
    });
