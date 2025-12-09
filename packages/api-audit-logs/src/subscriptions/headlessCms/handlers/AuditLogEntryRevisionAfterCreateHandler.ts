import WebinyError from "@webiny/error";
import { EntryRevisionAfterCreateHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/events.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogEntryRevisionAfterCreateHandler
    implements EntryRevisionAfterCreateHandler.Interface
{
    constructor(private context: AuditLogsContext) {}

    async handle(event: EntryRevisionAfterCreateHandler.Event): Promise<void> {
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
