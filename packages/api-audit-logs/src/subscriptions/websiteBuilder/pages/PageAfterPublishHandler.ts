import { WebinyError } from "@webiny/error";
import { PageAfterPublishEventHandler } from "@webiny/api-website-builder/features/pages/PublishPage/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class PageAfterPublishHandlerImpl implements PageAfterPublishEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: PageAfterPublishEventHandler.Event): Promise<void> {
        try {
            const { page } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.PUBLISH);
            await createAuditLog("Website Page Published", page, page.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterPublishEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_PUBLISH_HANDLER"
            });
        }
    }
}

export const PageAfterPublishAuditHandler = PageAfterPublishEventHandler.createImplementation({
    implementation: PageAfterPublishHandlerImpl,
    dependencies: [AuditLogsContext]
});
