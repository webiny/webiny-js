import { WebinyError } from "@webiny/error";
import { RedirectAfterMoveHandler } from "@webiny/api-website-builder/features/redirects/MoveRedirect/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class RedirectAfterMoveHandlerImpl implements RedirectAfterMoveHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: RedirectAfterMoveHandler.Event): Promise<void> {
        try {
            const { redirect } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.REDIRECT.MOVE);
            await createAuditLog("Website Redirect Moved", redirect, redirect.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing RedirectAfterMoveHandler",
                code: "AUDIT_LOGS_AFTER_REDIRECT_MOVE_HANDLER"
            });
        }
    }
}

export const RedirectAfterMoveAuditHandler = RedirectAfterMoveHandler.createImplementation({
    implementation: RedirectAfterMoveHandlerImpl,
    dependencies: [AuditLogsContext]
});
