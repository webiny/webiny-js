import { WebinyError } from "@webiny/error";
import { PageAfterDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class PageAfterDeleteHandlerImpl implements PageAfterDeleteEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: PageAfterDeleteEventHandler.Event): Promise<void> {
        try {
            const { page } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.DELETE);
            await createAuditLog("Website Page Delete", page, page.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterDeleteEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_DELETE_HANDLER"
            });
        }
    }
}

export const PageAfterDeleteAuditHandler = PageAfterDeleteEventHandler.createImplementation({
    implementation: PageAfterDeleteHandlerImpl,
    dependencies: [AuditLogsContext]
});
