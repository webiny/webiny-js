import { WebinyError } from "@webiny/error";
import { RedirectAfterUpdateEventHandler } from "@webiny/api-website-builder/features/redirects/UpdateRedirect/index.js";
import { AuditLogRecorder } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class RedirectAfterUpdateHandlerImpl implements RedirectAfterUpdateEventHandler.Interface {
    constructor(private recorder: AuditLogRecorder.Interface) {}

    async handle(event: RedirectAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { redirect, original } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.REDIRECT.UPDATE);
            await createAuditLog(
                "Website Redirect Updated",
                { before: original, after: redirect },
                redirect.id,
                this.recorder
            );
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
        dependencies: [AuditLogRecorder]
    }
);
