import WebinyError from "@webiny/error";
import { GroupAfterUpdateHandler } from "@webiny/api-security/features/groups/UpdateGroup";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogGroupAfterUpdateHandler implements GroupAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: GroupAfterUpdateHandler.Event): Promise<void> {
        try {
            const { updated, original } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.ROLE.UPDATE);

            await createAuditLog(
                "Role updated",
                { before: original, after: updated },
                updated.id,
                this.context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogGroupAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_ROLE_UPDATE_HANDLER"
            });
        }
    }
}
