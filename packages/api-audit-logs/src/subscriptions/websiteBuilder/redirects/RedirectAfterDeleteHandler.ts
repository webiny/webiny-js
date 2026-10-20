import { WebinyError } from "@webiny/error";
import { RedirectAfterDeleteEventHandler } from "@webiny/api-website-builder/features/redirects/DeleteRedirect/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class RedirectAfterDeleteHandlerImpl implements RedirectAfterDeleteEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: RedirectAfterDeleteEventHandler.Event): Promise<void> {
        try {
            const { redirect } = event.payload;
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.WEBSITE_BUILDER.REDIRECT.DELETE,
                message: "Website Redirect Deleted",
                content: redirect,
                entityId: redirect.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing RedirectAfterDeleteEventHandler",
                code: "AUDIT_LOGS_AFTER_REDIRECT_DELETE_HANDLER"
            });
        }
    }
}

export const RedirectAfterDeleteAuditHandler = RedirectAfterDeleteEventHandler.createImplementation(
    {
        implementation: RedirectAfterDeleteHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    }
);
