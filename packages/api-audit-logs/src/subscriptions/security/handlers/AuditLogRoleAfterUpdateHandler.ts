import WebinyError from "@webiny/error";
import { RoleAfterUpdateEventHandler } from "@webiny/api-core/features/security/roles/UpdateRole/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogRoleAfterUpdateHandlerImpl implements RoleAfterUpdateEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: RoleAfterUpdateEventHandler.Event): Promise<void> {
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
                message: "Error while executing AuditLogRoleAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_ROLE_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogRoleAfterUpdateHandler = RoleAfterUpdateEventHandler.createImplementation({
    implementation: AuditLogRoleAfterUpdateHandlerImpl,
    dependencies: [AuditLogsContext]
});
