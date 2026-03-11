import WebinyError from "@webiny/error";
import { UserAfterDeleteEventHandler } from "@webiny/api-core/features/DeleteUser";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogUserAfterDeleteHandlerImpl implements UserAfterDeleteEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: UserAfterDeleteEventHandler.Event): Promise<void> {
        try {
            const { user } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.USER.DELETE);

            await createAuditLog("User deleted", user, user.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogUserAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_USER_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogUserAfterDeleteHandler = UserAfterDeleteEventHandler.createImplementation({
    implementation: AuditLogUserAfterDeleteHandlerImpl,
    dependencies: [AuditLogsContext]
});
