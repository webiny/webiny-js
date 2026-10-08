import WebinyError from "@webiny/error";
import { RoleAfterDeleteEventHandler } from "@webiny/api-core/features/security/roles/DeleteRole/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogRoleAfterDeleteHandlerImpl implements RoleAfterDeleteEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: RoleAfterDeleteEventHandler.Event): Promise<void> {
        try {
            const { role } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.SECURITY.ROLE.DELETE,
                message: "Role deleted",
                content: role,
                entityId: role.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogRoleAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_ROLE_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogRoleAfterDeleteHandler = RoleAfterDeleteEventHandler.createImplementation({
    implementation: AuditLogRoleAfterDeleteHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
