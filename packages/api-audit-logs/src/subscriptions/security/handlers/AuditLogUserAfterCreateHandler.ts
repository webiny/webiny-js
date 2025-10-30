import WebinyError from "@webiny/error";
import { UserAfterCreateHandler } from "@webiny/api-core/features/CreateUser";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogUserAfterCreateHandler implements UserAfterCreateHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: UserAfterCreateHandler.Event): Promise<void> {
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
