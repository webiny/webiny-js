import { WebinyError } from "@webiny/error";
import { PageAfterCreateRevisionFromEventHandler } from "@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class PageAfterCreateRevisionFromHandlerImpl
    implements PageAfterCreateRevisionFromEventHandler.Interface
{
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: PageAfterCreateRevisionFromEventHandler.Event): Promise<void> {
        try {
            const { page } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.CREATE_REVISION_FROM);
            await createAuditLog("Website Page Create Revision From", page, page.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterCreateRevisionFromEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_CREATE_REVISION_FROM_HANDLER"
            });
        }
    }
}

export const PageAfterCreateRevisionFromAuditHandler =
    PageAfterCreateRevisionFromEventHandler.createImplementation({
        implementation: PageAfterCreateRevisionFromHandlerImpl,
        dependencies: [AuditLogsContext]
    });
