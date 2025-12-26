import { WebinyError } from "@webiny/error";
import { RedirectAfterCreateHandler } from "@webiny/api-website-builder/features/redirects/CreateRedirect/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class RedirectAfterCreateHandlerImpl implements RedirectAfterCreateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: RedirectAfterCreateHandler.Event): Promise<void> {
        try {
            const { redirect } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.REDIRECT.CREATE);
            await createAuditLog("Website Redirect Created", redirect, redirect.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing RedirectAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_REDIRECT_CREATE_HANDLER"
            });
        }
    }
}

export const RedirectAfterCreateAuditHandler = RedirectAfterCreateHandler.createImplementation({
    implementation: RedirectAfterCreateHandlerImpl,
    dependencies: [AuditLogsContext]
});
