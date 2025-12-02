import WebinyError from "@webiny/error";
import { UserAfterUpdateHandler } from "@webiny/api-core/features/UpdateUser";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogUserAfterUpdateHandler implements UserAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: UserAfterUpdateHandler.Event): Promise<void> {
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
