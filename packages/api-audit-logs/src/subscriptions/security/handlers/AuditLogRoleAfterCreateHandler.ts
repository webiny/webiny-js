import WebinyError from "@webiny/error";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";
import { RoleAfterCreateEventHandler } from "@webiny/api-core/features/security/roles/CreateRole/index.js";

class AuditLogRoleAfterCreateHandlerImpl implements RoleAfterCreateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: RoleAfterCreateEventHandler.Event): Promise<void> {
        try {
            const { role } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.SECURITY.ROLE.CREATE,
                message: "Role created",
                content: role,
                entityId: role.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogRoleAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_ROLE_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogRoleAfterCreateHandler = RoleAfterCreateEventHandler.createImplementation({
    implementation: AuditLogRoleAfterCreateHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
