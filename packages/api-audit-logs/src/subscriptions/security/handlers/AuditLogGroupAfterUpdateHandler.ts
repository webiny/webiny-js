import WebinyError from "@webiny/error";
import { GroupAfterUpdateHandler } from "@webiny/api-core/features/UpdateGroup";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogGroupAfterUpdateHandlerImpl implements GroupAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

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

export const AuditLogGroupAfterUpdateHandler = GroupAfterUpdateHandler.createImplementation({
    implementation: AuditLogGroupAfterUpdateHandlerImpl,
    dependencies: [AuditLogsContext]
});
