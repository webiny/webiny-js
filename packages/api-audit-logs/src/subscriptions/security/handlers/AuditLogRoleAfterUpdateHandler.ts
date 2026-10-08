import WebinyError from "@webiny/error";
import { RoleAfterUpdateEventHandler } from "@webiny/api-core/features/security/roles/UpdateRole/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogRoleAfterUpdateHandlerImpl implements RoleAfterUpdateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: RoleAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { updated, original } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.SECURITY.ROLE.UPDATE,
                message: "Role updated",
                content: { before: original, after: updated },
                entityId: updated.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
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
    dependencies: [RecordAuditLogUseCase]
});
