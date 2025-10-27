import WebinyError from "@webiny/error";
import { UserAfterDeleteHandler } from "@webiny/api-admin-users/features/DeleteUser";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogUserAfterDeleteHandler implements UserAfterDeleteHandler.Interface {
    constructor(private context: AuditLogsContext) {}

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
