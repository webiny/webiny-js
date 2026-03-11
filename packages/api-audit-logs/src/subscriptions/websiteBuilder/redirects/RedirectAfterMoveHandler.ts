import { WebinyError } from "@webiny/error";
import { RedirectAfterMoveEventHandler } from "@webiny/api-website-builder/features/redirects/MoveRedirect/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class RedirectAfterMoveHandlerImpl implements RedirectAfterMoveEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: RedirectAfterMoveEventHandler.Event): Promise<void> {
        try {
            const { redirect } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.REDIRECT.MOVE);
            await createAuditLog("Website Redirect Moved", redirect, redirect.id, this.context);
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
    dependencies: [AuditLogsContext]
});
