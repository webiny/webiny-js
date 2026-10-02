import { WebinyError } from "@webiny/error";
import { PageAfterCreateRevisionFromEventHandler } from "@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class PageAfterCreateRevisionFromHandlerImpl
    implements PageAfterCreateRevisionFromEventHandler.Interface
{
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: PageAfterCreateRevisionFromEventHandler.Event): Promise<void> {
        try {
            const { page } = event.payload;
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.WEBSITE_BUILDER.PAGE.CREATE_REVISION_FROM,
                message: "Website Page Create Revision From",
                content: page,
                entityId: page.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterCreateRevisionFromEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_CREATE_REVISION_FROM_HANDLER"
            });
        }
    }
}

export const PageAfterCreateRevisionFromAuditHandler =
    PageAfterCreateRevisionFromEventHandler.createImplementation({
        implementation: PageAfterCreateRevisionFromHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
