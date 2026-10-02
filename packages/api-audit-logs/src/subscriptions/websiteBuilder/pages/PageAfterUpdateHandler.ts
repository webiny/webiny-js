import { WebinyError } from "@webiny/error";
import { PageAfterUpdateEventHandler } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class PageAfterUpdateHandlerImpl implements PageAfterUpdateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: PageAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { page, original } = event.payload;
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.WEBSITE_BUILDER.PAGE.UPDATE,
                message: "Website Page Updated",
                content: { before: original, after: page },
                entityId: page.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterUpdateEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_UPDATE_HANDLER"
            });
        }
    }
}

export const PageAfterUpdateAuditHandler = PageAfterUpdateEventHandler.createImplementation({
    implementation: PageAfterUpdateHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
