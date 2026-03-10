import { WebinyError } from "@webiny/error";
import { PageAfterUnpublishEventHandler } from "@webiny/api-website-builder/features/pages/UnpublishPage/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class PageAfterUnpublishHandlerImpl implements PageAfterUnpublishEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: PageAfterUnpublishEventHandler.Event): Promise<void> {
        try {
            const { page } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.UNPUBLISH);
            await createAuditLog("Website Page Unpublished", page, page.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterUnpublishEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_UNPUBLISH_HANDLER"
            });
        }
    }
}

export const PageAfterUnpublishAuditHandler = PageAfterUnpublishEventHandler.createImplementation({
    implementation: PageAfterUnpublishHandlerImpl,
    dependencies: [AuditLogsContext]
});
