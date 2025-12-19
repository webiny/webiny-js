import { WebinyError } from "@webiny/error";
import { RedirectAfterUpdateHandler } from "@webiny/api-website-builder/features/redirects/UpdateRedirect/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class RedirectAfterUpdateHandlerImpl implements RedirectAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: RedirectAfterUpdateHandler.Event): Promise<void> {
        try {
            const { redirect, original } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.REDIRECT.UPDATE);
            await createAuditLog(
                "Website Redirect Updated",
                { before: original, after: redirect },
                redirect.id,
                this.context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing RedirectAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_REDIRECT_UPDATE_HANDLER"
            });
        }
    }
}

export const RedirectAfterUpdateAuditHandler = RedirectAfterUpdateHandler.createImplementation({
    implementation: RedirectAfterUpdateHandlerImpl,
    dependencies: [AuditLogsContext]
});
