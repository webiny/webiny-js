import WebinyError from "@webiny/error";
import { EntryAfterUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogEntryAfterUpdateEventHandlerImpl implements EntryAfterUpdateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: EntryAfterUpdateEventHandler.Event): Promise<void> {
        const { model, entry, original } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.HEADLESS_CMS.ENTRY_REVISION.UPDATE,
                message: "Entry revision updated",
                content: { before: original, after: entry },
                entityId: entry.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryAfterUpdateEventHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogEntryAfterUpdateEventHandler =
    EntryAfterUpdateEventHandler.createImplementation({
        implementation: AuditLogEntryAfterUpdateEventHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
