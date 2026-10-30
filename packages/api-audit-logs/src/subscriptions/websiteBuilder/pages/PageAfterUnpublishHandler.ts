import { WebinyError } from "@webiny/error";
import { PageAfterUnpublishEventHandler } from "@webiny/api-website-builder/features/pages/UnpublishPage/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class PageAfterUnpublishHandlerImpl implements PageAfterUnpublishEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: PageAfterUnpublishEventHandler.Event): Promise<void> {
        try {
            const { page } = event.payload;
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.WEBSITE_BUILDER.PAGE.UNPUBLISH,
                message: "Website Page Unpublished",
                content: page,
                entityId: page.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterUnpublishEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_UNPUBLISH_HANDLER"
            });
        }
    }
}

export const PageAfterUnpublishAuditHandler = PageAfterUnpublishEventHandler.createImplementation({
    implementation: PageAfterUnpublishHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
