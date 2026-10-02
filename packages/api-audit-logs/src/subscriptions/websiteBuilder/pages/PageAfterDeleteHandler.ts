import { WebinyError } from "@webiny/error";
import { PageAfterDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class PageAfterDeleteHandlerImpl implements PageAfterDeleteEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: PageAfterDeleteEventHandler.Event): Promise<void> {
        try {
            const { page } = event.payload;
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.WEBSITE_BUILDER.PAGE.DELETE,
                message: "Website Page Delete",
                content: page,
                entityId: page.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterDeleteEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_DELETE_HANDLER"
            });
        }
    }
}

export const PageAfterDeleteAuditHandler = PageAfterDeleteEventHandler.createImplementation({
    implementation: PageAfterDeleteHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
