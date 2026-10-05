import WebinyError from "@webiny/error";
import { EntryAfterPublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { AUDIT } from "~/config.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";

class AuditLogEntryAfterPublishEventHandlerImpl implements EntryAfterPublishEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: EntryAfterPublishEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.HEADLESS_CMS.ENTRY_REVISION.PUBLISH,
                message: "Entry revision published",
                content: entry,
                entityId: entry.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryAfterPublishEventHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_PUBLISH_HANDLER"
            });
        }
    }
}

export const AuditLogEntryAfterPublishEventHandler =
    EntryAfterPublishEventHandler.createImplementation({
        implementation: AuditLogEntryAfterPublishEventHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
