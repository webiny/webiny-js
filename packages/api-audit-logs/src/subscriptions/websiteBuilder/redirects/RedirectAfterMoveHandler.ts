import { WebinyError } from "@webiny/error";
import { RedirectAfterMoveEventHandler } from "@webiny/api-website-builder/features/redirects/MoveRedirect/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class RedirectAfterMoveHandlerImpl implements RedirectAfterMoveEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: RedirectAfterMoveEventHandler.Event): Promise<void> {
        try {
            const { redirect } = event.payload;
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.WEBSITE_BUILDER.REDIRECT.MOVE,
                message: "Website Redirect Moved",
                content: redirect,
                entityId: redirect.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing RedirectAfterMoveEventHandler",
                code: "AUDIT_LOGS_AFTER_REDIRECT_MOVE_HANDLER"
            });
        }
    }
}

export const RedirectAfterMoveAuditHandler = RedirectAfterMoveEventHandler.createImplementation({
    implementation: RedirectAfterMoveHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
