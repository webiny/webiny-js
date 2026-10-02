import WebinyError from "@webiny/error";
import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { AUDIT } from "~/config.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";

class AuditLogEntryAfterDeleteHandlerImpl implements EntryAfterDeleteEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
        const { model, entry, permanent } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            if (permanent) {
                const recordResult = await this.recordAuditLog.execute({
                    audit: AUDIT.HEADLESS_CMS.ENTRY.DELETE,
                    message: "Entry deleted",
                    content: entry,
                    entityId: entry.entryId
                });
                if (recordResult.isFail()) {
                    throw recordResult.error;
                }
            } else {
                const recordResult = await this.recordAuditLog.execute({
                    audit: AUDIT.HEADLESS_CMS.ENTRY.MOVE_TO_TRASH,
                    message: "Entry moved to trash",
                    content: entry,
                    entityId: entry.entryId
                });
                if (recordResult.isFail()) {
                    throw recordResult.error;
                }
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogEntryAfterDeleteEventHandler =
    EntryAfterDeleteEventHandler.createImplementation({
        implementation: AuditLogEntryAfterDeleteHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
