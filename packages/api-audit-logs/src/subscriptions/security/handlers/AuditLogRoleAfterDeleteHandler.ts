import WebinyError from "@webiny/error";
import { RoleAfterDeleteHandler } from "@webiny/api-core/features/security/roles/DeleteRole/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogRoleAfterDeleteHandlerImpl implements RoleAfterDeleteHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: RoleAfterDeleteHandler.Event): Promise<void> {
        try {
            const { role } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.ROLE.DELETE);

            await createAuditLog("Role deleted", role, role.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogRoleAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_ROLE_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogRoleAfterDeleteHandler = RoleAfterDeleteHandler.createImplementation({
    implementation: AuditLogRoleAfterDeleteHandlerImpl,
    dependencies: [AuditLogsContext]
});
