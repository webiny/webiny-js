import { WebinyError } from "@webiny/error";
import { PageAfterDuplicateEventHandler } from "@webiny/api-website-builder/features/pages/DuplicatePage/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class PageAfterDuplicateHandlerImpl implements PageAfterDuplicateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: PageAfterDuplicateEventHandler.Event): Promise<void> {
        try {
            const { page, original } = event.payload;
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.WEBSITE_BUILDER.PAGE.DUPLICATE,
                message: "Website Page Duplicate",
                content: { original, page },
                entityId: original.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterDuplicateEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_DUPLICATE_HANDLER"
            });
        }
    }
}

export const PageAfterDuplicateAuditHandler = PageAfterDuplicateEventHandler.createImplementation({
    implementation: PageAfterDuplicateHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
