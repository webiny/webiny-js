import WebinyError from "@webiny/error";
import { GroupAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogGroupAfterDeleteHandlerImpl implements GroupAfterDeleteHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: GroupAfterDeleteHandler.Event): Promise<void> {
        const { group } = event.payload;

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.GROUP.DELETE);

            await createAuditLog("Group deleted", group, group.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogGroupAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_GROUP_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogGroupAfterDeleteHandler = GroupAfterDeleteHandler.createImplementation({
    implementation: AuditLogGroupAfterDeleteHandlerImpl,
    dependencies: [AuditLogsContext]
});
