import WebinyError from "@webiny/error";
import { EntryRevisionAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { AUDIT } from "~/config.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";

class AuditLogEntryRevisionAfterDeleteEventHandlerImpl
    implements EntryRevisionAfterDeleteEventHandler.Interface
{
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: EntryRevisionAfterDeleteEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.HEADLESS_CMS.ENTRY_REVISION.DELETE,
                message: "Entry revision deleted",
                content: entry,
                entityId: entry.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryRevisionAfterDeleteEventHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogEntryRevisionAfterDeleteEventHandler =
    EntryRevisionAfterDeleteEventHandler.createImplementation({
        implementation: AuditLogEntryRevisionAfterDeleteEventHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
