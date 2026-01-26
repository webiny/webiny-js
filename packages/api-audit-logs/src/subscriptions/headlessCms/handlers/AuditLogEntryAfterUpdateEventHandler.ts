import WebinyError from "@webiny/error";
import { EntryAfterUpdateHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogEntryAfterUpdateHandlerImpl implements EntryAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: EntryAfterUpdateHandler.Event): Promise<void> {
        const { model, entry, original } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.UPDATE);

            await createAuditLog(
                "Entry revision updated",
                { before: original, after: entry },
                entry.id,
                this.context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogEntryAfterUpdateEventHandler = EntryAfterUpdateHandler.createImplementation({
    implementation: AuditLogEntryAfterUpdateHandlerImpl,
    dependencies: [AuditLogsContext]
});
