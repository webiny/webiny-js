import WebinyError from "@webiny/error";
import { EntryAfterRestoreFromBinHandler } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogEntryAfterRestoreFromBinHandler
    implements EntryAfterRestoreFromBinHandler.Interface
{
    constructor(private context: AuditLogsContext) {}

    async handle(event: EntryAfterRestoreFromBinHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.RESTORE_FROM_TRASH);
            await createAuditLog("Entry restored from trash", entry, entry.entryId, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryAfterRestoreFromBinHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_RESTORE_FROM_TRASH_HANDLER"
            });
        }
    }
}
