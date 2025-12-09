import WebinyError from "@webiny/error";
import { EntryAfterUnpublishHandler } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogEntryAfterUnpublishHandler implements EntryAfterUnpublishHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: EntryAfterUnpublishHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.UNPUBLISH);

            await createAuditLog("Entry revision unpublished", entry, entry.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryAfterUnpublishHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_UNPUBLISH_HANDLER"
            });
        }
    }
}
