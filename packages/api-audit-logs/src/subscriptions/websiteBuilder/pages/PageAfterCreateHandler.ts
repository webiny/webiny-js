import { WebinyError } from "@webiny/error";
import { PageAfterCreateHandler } from "@webiny/api-website-builder/features/pages/CreatePage/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class PageAfterCreateHandlerImpl implements PageAfterCreateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: PageAfterCreateHandler.Event): Promise<void> {
        try {
            const { page } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.CREATE);
            await createAuditLog("Website Page Created", page, page.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_CREATE_HANDLER"
            });
        }
    }
}

export const PageAfterCreateAuditHandler = PageAfterCreateHandler.createImplementation({
    implementation: PageAfterCreateHandlerImpl,
    dependencies: [AuditLogsContext]
});
