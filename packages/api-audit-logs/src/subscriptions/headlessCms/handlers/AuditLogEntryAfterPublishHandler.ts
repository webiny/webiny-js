import WebinyError from "@webiny/error";
import { EntryAfterPublishHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogEntryAfterPublishHandler implements EntryAfterPublishHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: EntryAfterPublishHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.PUBLISH);

            await createAuditLog("Entry revision published", entry, entry.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryAfterPublishHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_PUBLISH_HANDLER"
            });
        }
    }
}
