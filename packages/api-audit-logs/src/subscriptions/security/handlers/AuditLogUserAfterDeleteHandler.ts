import WebinyError from "@webiny/error";
import { UserAfterDeleteHandler } from "@webiny/api-core/features/DeleteUser";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogUserAfterDeleteHandlerImpl implements UserAfterDeleteHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: UserAfterDeleteHandler.Event): Promise<void> {
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

export const AuditLogUserAfterDeleteHandler = UserAfterDeleteHandler.createImplementation({
    implementation: AuditLogUserAfterDeleteHandlerImpl,
    dependencies: [AuditLogsContext]
});
