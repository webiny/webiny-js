import WebinyError from "@webiny/error";
import { RoleAfterUpdateHandler } from "@webiny/api-core/features/security/roles/UpdateRole/index.js";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";

class AuditLogRoleAfterUpdateHandlerImpl implements RoleAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: RoleAfterUpdateHandler.Event): Promise<void> {
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

export const AuditLogRoleAfterUpdateHandler = RoleAfterUpdateHandler.createImplementation({
    implementation: AuditLogRoleAfterUpdateHandlerImpl,
    dependencies: [AuditLogsContext]
});
