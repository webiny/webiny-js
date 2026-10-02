import { WebinyError } from "@webiny/error";
import { RedirectAfterUpdateEventHandler } from "@webiny/api-website-builder/features/redirects/UpdateRedirect/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class RedirectAfterUpdateHandlerImpl implements RedirectAfterUpdateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: RedirectAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { redirect, original } = event.payload;
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.WEBSITE_BUILDER.REDIRECT.UPDATE,
                message: "Website Redirect Updated",
                content: { before: original, after: redirect },
                entityId: redirect.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing RedirectAfterUpdateEventHandler",
                code: "AUDIT_LOGS_AFTER_REDIRECT_UPDATE_HANDLER"
            });
        }
    }
}

export const RedirectAfterUpdateAuditHandler = RedirectAfterUpdateEventHandler.createImplementation(
    {
        implementation: RedirectAfterUpdateHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    }
);
