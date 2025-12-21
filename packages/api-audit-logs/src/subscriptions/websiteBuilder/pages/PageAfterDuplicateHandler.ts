import { WebinyError } from "@webiny/error";
import { PageAfterDuplicateHandler } from "@webiny/api-website-builder/features/pages/DuplicatePage/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";

class PageAfterDuplicateHandlerImpl implements PageAfterDuplicateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: PageAfterDuplicateHandler.Event): Promise<void> {
        try {
            const { page, original } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.WEBSITE_BUILDER.PAGE.DUPLICATE);
            await createAuditLog(
                "Website Page Duplicate",
                { original, page },
                original.id,
                this.context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing PageAfterDuplicateHandler",
                code: "AUDIT_LOGS_AFTER_PAGE_DUPLICATE_HANDLER"
            });
        }
    }
}

export const PageAfterDuplicateAuditHandler = PageAfterDuplicateHandler.createImplementation({
    implementation: PageAfterDuplicateHandlerImpl,
    dependencies: [AuditLogsContext]
});
