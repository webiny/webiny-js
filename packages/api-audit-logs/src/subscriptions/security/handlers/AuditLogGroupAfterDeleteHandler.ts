import WebinyError from "@webiny/error";
import { GroupAfterDeleteHandler } from "@webiny/api-core/features/DeleteGroup";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogGroupAfterDeleteHandlerImpl implements GroupAfterDeleteHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: GroupAfterDeleteHandler.Event): Promise<void> {
        try {
            const { group } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.ROLE.DELETE);

            await createAuditLog("Role deleted", group, group.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogGroupAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_ROLE_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogGroupAfterDeleteHandler = GroupAfterDeleteHandler.createImplementation({
    implementation: AuditLogGroupAfterDeleteHandlerImpl,
    dependencies: [AuditLogsContext]
});
