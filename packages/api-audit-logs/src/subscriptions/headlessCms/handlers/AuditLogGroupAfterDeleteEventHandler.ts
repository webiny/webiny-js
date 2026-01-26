import WebinyError from "@webiny/error";
import { GroupAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogGroupAfterDeleteHandlerEventImpl implements GroupAfterDeleteEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: GroupAfterDeleteEventHandler.Event): Promise<void> {
        const { group } = event.payload;

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.GROUP.DELETE);

            await createAuditLog("Group deleted", group, group.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogGroupAfterDeleteHandlerEvent",
                code: "AUDIT_LOGS_AFTER_GROUP_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogGroupAfterDeleteEventHandler = GroupAfterDeleteEventHandler.createImplementation({
    implementation: AuditLogGroupAfterDeleteHandlerEventImpl,
    dependencies: [AuditLogsContext]
});
