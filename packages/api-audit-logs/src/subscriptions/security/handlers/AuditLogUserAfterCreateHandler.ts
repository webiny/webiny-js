import WebinyError from "@webiny/error";
import { UserAfterCreateEventHandler } from "@webiny/api-core/features/users/CreateUser/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogUserAfterCreateHandlerImpl implements UserAfterCreateEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: UserAfterCreateEventHandler.Event): Promise<void> {
        try {
            const { user } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.USER.CREATE);

            await createAuditLog("User created", user, user.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogUserAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_USER_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogUserAfterCreateHandler = UserAfterCreateEventHandler.createImplementation({
    implementation: AuditLogUserAfterCreateHandlerImpl,
    dependencies: [AuditLogsContext]
});
