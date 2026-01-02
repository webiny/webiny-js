import { WebinyError } from "@webiny/error";
import { PageAfterMoveHandler } from "@webiny/api-website-builder/features/pages/MovePage/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class PageAfterMoveHandlerImpl implements PageAfterMoveHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: PageAfterMoveHandler.Event): Promise<void> {
        try {
            const { page } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.MOVE);
            await createAuditLog("Website Page Move", page, page.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterMoveHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_MOVE_HANDLER"
            });
        }
    }
}

export const PageAfterMoveAuditHandler = PageAfterMoveHandler.createImplementation({
    implementation: PageAfterMoveHandlerImpl,
    dependencies: [AuditLogsContext]
});
