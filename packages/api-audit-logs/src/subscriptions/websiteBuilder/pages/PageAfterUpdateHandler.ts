import { WebinyError } from "@webiny/error";
import { PageAfterUpdateEventHandler } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class PageAfterUpdateHandlerImpl implements PageAfterUpdateEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: PageAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { page, original } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.UPDATE);
            await createAuditLog(
                "Website Page Updated",
                { before: original, after: page },
                page.id,
                this.context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterUpdateEventHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_UPDATE_HANDLER"
            });
        }
    }
}

export const PageAfterUpdateAuditHandler = PageAfterUpdateEventHandler.createImplementation({
    implementation: PageAfterUpdateHandlerImpl,
    dependencies: [AuditLogsContext]
});
