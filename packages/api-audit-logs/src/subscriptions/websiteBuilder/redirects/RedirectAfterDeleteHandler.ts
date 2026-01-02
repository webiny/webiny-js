import { WebinyError } from "@webiny/error";
import { RedirectAfterDeleteHandler } from "@webiny/api-website-builder/features/redirects/DeleteRedirect/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class RedirectAfterDeleteHandlerImpl implements RedirectAfterDeleteHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: RedirectAfterDeleteHandler.Event): Promise<void> {
        try {
            const { redirect } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.REDIRECT.DELETE);
            await createAuditLog("Website Redirect Deleted", redirect, redirect.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing RedirectAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_REDIRECT_DELETE_HANDLER"
            });
        }
    }
}

export const RedirectAfterDeleteAuditHandler = RedirectAfterDeleteHandler.createImplementation({
    implementation: RedirectAfterDeleteHandlerImpl,
    dependencies: [AuditLogsContext]
});
