import WebinyError from "@webiny/error";
import { EntryAfterRestoreFromBinEventHandler } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/index.js";
import { AUDIT } from "~/config.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";

class AuditLogEntryAfterRestoreFromBinEventHandlerImpl
    implements EntryAfterRestoreFromBinEventHandler.Interface
{
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: EntryAfterRestoreFromBinEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.HEADLESS_CMS.ENTRY.RESTORE_FROM_TRASH,
                message: "Entry restored from trash",
                content: entry,
                entityId: entry.entryId
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
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
        dependencies: [RecordAuditLogUseCase]
    });
