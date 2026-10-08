import { WebinyError } from "@webiny/error";
import { PageAfterPublishEventHandler } from "@webiny/api-website-builder/features/pages/PublishPage/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class PageAfterPublishHandlerImpl implements PageAfterPublishEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: PageAfterPublishEventHandler.Event): Promise<void> {
        try {
            const { page } = event.payload;
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.WEBSITE_BUILDER.PAGE.PUBLISH,
                message: "Website Page Published",
                content: page,
                entityId: page.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterPublishEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_PUBLISH_HANDLER"
            });
        }
    }
}

export const PageAfterPublishAuditHandler = PageAfterPublishEventHandler.createImplementation({
    implementation: PageAfterPublishHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
