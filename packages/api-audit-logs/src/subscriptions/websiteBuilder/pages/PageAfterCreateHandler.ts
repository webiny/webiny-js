import { WebinyError } from "@webiny/error";
import { PageAfterCreateEventHandler } from "@webiny/api-website-builder/features/pages/CreatePage/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class PageAfterCreateHandlerImpl implements PageAfterCreateEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: PageAfterCreateEventHandler.Event): Promise<void> {
        try {
            const { page } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.CREATE);
            await createAuditLog("Website Page Created", page, page.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterCreateEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_CREATE_HANDLER"
            });
        }
    }
}

export const PageAfterCreateAuditHandler = PageAfterCreateEventHandler.createImplementation({
    implementation: PageAfterCreateHandlerImpl,
    dependencies: [AuditLogsContext]
});
