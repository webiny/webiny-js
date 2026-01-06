import WebinyError from "@webiny/error";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { RoleAfterCreateHandler } from "@webiny/api-core/features/security/roles/CreateRole/index.js";

class AuditLogRoleAfterCreateHandlerImpl implements RoleAfterCreateHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: RoleAfterCreateHandler.Event): Promise<void> {
        try {
            const { role } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.ROLE.CREATE);

            await createAuditLog("Role created", role, role.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogRoleAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_ROLE_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogRoleAfterCreateHandler = RoleAfterCreateHandler.createImplementation({
    implementation: AuditLogRoleAfterCreateHandlerImpl,
    dependencies: [AuditLogsContext]
});
