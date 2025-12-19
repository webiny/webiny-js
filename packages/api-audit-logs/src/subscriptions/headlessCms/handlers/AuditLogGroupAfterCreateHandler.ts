import WebinyError from "@webiny/error";
import { GroupAfterCreateHandler } from "@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogGroupAfterCreateHandlerImpl implements GroupAfterCreateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: GroupAfterCreateHandler.Event): Promise<void> {
        const { group } = event.payload;

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.GROUP.CREATE);

            await createAuditLog("Group created", group, group.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogGroupAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_GROUP_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogGroupAfterCreateHandler = GroupAfterCreateHandler.createImplementation({
    implementation: AuditLogGroupAfterCreateHandlerImpl,
    dependencies: [AuditLogsContext]
});
