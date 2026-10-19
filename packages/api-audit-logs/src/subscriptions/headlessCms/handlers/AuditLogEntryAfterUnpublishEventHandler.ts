import WebinyError from "@webiny/error";
import { EntryAfterUnpublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/index.js";
import { AUDIT } from "~/config.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";

class AuditLogEntryAfterUnpublishEventHandlerImpl
    implements EntryAfterUnpublishEventHandler.Interface
{
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: EntryAfterUnpublishEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.HEADLESS_CMS.ENTRY_REVISION.UNPUBLISH,
                message: "Entry revision unpublished",
                content: entry,
                entityId: entry.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
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
        dependencies: [RecordAuditLogUseCase]
    });
