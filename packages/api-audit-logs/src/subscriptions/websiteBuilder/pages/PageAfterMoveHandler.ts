import { WebinyError } from "@webiny/error";
import { PageAfterMoveEventHandler } from "@webiny/api-website-builder/features/pages/MovePage/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class PageAfterMoveHandlerImpl implements PageAfterMoveEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: PageAfterMoveEventHandler.Event): Promise<void> {
        try {
            const { page } = event.payload;
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.WEBSITE_BUILDER.PAGE.MOVE,
                message: "Website Page Move",
                content: page,
                entityId: page.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterMoveEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_MOVE_HANDLER"
            });
        }
    }
}

export const PageAfterMoveAuditHandler = PageAfterMoveEventHandler.createImplementation({
    implementation: PageAfterMoveHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
