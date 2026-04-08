import WebinyError from "@webiny/error";
import { UserAfterUpdateEventHandler } from "@webiny/api-core/features/users/UpdateUser/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogUserAfterUpdateHandlerImpl implements UserAfterUpdateEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: UserAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { updatedUser, originalUser } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.USER.UPDATE);

            await createAuditLog(
                "User updated",
                { before: originalUser, after: updatedUser },
                updatedUser.id,
                this.context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogUserAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_USER_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogUserAfterUpdateHandler = UserAfterUpdateEventHandler.createImplementation({
    implementation: AuditLogUserAfterUpdateHandlerImpl,
    dependencies: [AuditLogsContext]
});
