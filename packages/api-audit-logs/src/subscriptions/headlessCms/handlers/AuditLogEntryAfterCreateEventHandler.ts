import WebinyError from "@webiny/error";
import { EntryAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogEntryAfterCreateHandlerImpl implements EntryAfterCreateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: EntryAfterCreateEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;

        if (model.isPrivate) {
            return;
        }

        try {
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.HEADLESS_CMS.ENTRY.CREATE,
                message: "Entry created",
                content: entry,
                entityId: entry.entryId
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogEntryAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_ENTRY_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogEntryAfterCreateEventHandler =
    EntryAfterCreateEventHandler.createImplementation({
        implementation: AuditLogEntryAfterCreateHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
