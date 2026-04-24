import WebinyError from "@webiny/error";
import { EntryAfterRestoreFromBinEventHandler } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogEntryAfterRestoreFromBinEventHandlerImpl
    implements EntryAfterRestoreFromBinEventHandler.Interface
{
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: EntryAfterRestoreFromBinEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.RESTORE_FROM_TRASH);
            await createAuditLog("Entry restored from trash", entry, entry.entryId, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryAfterRestoreFromBinEventHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_RESTORE_FROM_TRASH_HANDLER"
            });
        }
    }
}

export const AuditLogEntryAfterRestoreFromBinEventHandler =
    EntryAfterRestoreFromBinEventHandler.createImplementation({
        implementation: AuditLogEntryAfterRestoreFromBinEventHandlerImpl,
        dependencies: [AuditLogsContext]
    });
