import { WebinyError } from "@webiny/error";
import { PageAfterCreateEventHandler } from "@webiny/api-website-builder/features/pages/CreatePage/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class PageAfterCreateHandlerImpl implements PageAfterCreateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: PageAfterCreateEventHandler.Event): Promise<void> {
        try {
            const { page } = event.payload;
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.WEBSITE_BUILDER.PAGE.CREATE,
                message: "Website Page Created",
                content: page,
                entityId: page.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterCreateEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_CREATE_HANDLER"
            });
        }
    }
}

export const PageAfterCreateAuditHandler = PageAfterCreateEventHandler.createImplementation({
    implementation: PageAfterCreateHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
