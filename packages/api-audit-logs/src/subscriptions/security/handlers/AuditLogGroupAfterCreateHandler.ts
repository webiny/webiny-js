import WebinyError from "@webiny/error";
import { GroupAfterCreateHandler } from "@webiny/api-core/features/CreateGroup";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogGroupAfterCreateHandlerImpl implements GroupAfterCreateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: GroupAfterCreateHandler.Event): Promise<void> {
        try {
            const { group } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.ROLE.CREATE);

            await createAuditLog("Role created", group, group.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogGroupAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_ROLE_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogGroupAfterCreateHandler = GroupAfterCreateHandler.createImplementation({
    implementation: AuditLogGroupAfterCreateHandlerImpl,
    dependencies: [AuditLogsContext]
});
