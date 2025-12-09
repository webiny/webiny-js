import WebinyError from "@webiny/error";
import { EntryAfterCreateHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogEntryAfterCreateHandler implements EntryAfterCreateHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: EntryAfterCreateHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.CREATE);

            await createAuditLog("Entry created", entry, entry.entryId, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_CREATE_HANDLER"
            });
        }
    }
}
