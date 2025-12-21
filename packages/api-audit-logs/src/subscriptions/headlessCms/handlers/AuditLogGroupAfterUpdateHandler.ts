import WebinyError from "@webiny/error";
import { GroupAfterUpdateHandler } from "@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogsContext } from "~/abstractions.js";

class AuditLogGroupAfterUpdateHandlerImpl implements GroupAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: GroupAfterUpdateHandler.Event): Promise<void> {
        const { group, original } = event.payload;

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.GROUP.UPDATE);

            await createAuditLog(
                "Group updated",
                { before: original, after: group },
                group.id,
                this.context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogGroupAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_GROUP_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogGroupAfterUpdateHandler = GroupAfterUpdateHandler.createImplementation({
    implementation: AuditLogGroupAfterUpdateHandlerImpl,
    dependencies: [AuditLogsContext]
});
