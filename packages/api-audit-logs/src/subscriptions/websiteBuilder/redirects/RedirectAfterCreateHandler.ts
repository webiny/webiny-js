import { WebinyError } from "@webiny/error";
import { RedirectAfterCreateEventHandler } from "@webiny/api-website-builder/features/redirects/CreateRedirect/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class RedirectAfterCreateHandlerImpl implements RedirectAfterCreateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: RedirectAfterCreateEventHandler.Event): Promise<void> {
        try {
            const { redirect } = event.payload;
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.WEBSITE_BUILDER.REDIRECT.CREATE,
                message: "Website Redirect Created",
                content: redirect,
                entityId: redirect.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing RedirectAfterCreateEventHandler",
                code: "AUDIT_LOGS_AFTER_REDIRECT_CREATE_HANDLER"
            });
        }
    }
}

export const RedirectAfterCreateAuditHandler = RedirectAfterCreateEventHandler.createImplementation(
    {
        implementation: RedirectAfterCreateHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    }
);
