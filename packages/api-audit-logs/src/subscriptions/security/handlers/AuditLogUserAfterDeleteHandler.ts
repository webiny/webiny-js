import WebinyError from "@webiny/error";
import { UserAfterDeleteEventHandler } from "@webiny/api-core/features/users/DeleteUser/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogUserAfterDeleteHandlerImpl implements UserAfterDeleteEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: UserAfterDeleteEventHandler.Event): Promise<void> {
        try {
            const { user } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.SECURITY.USER.DELETE,
                message: "User deleted",
                content: user,
                entityId: user.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogUserAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_USER_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogUserAfterDeleteHandler = UserAfterDeleteEventHandler.createImplementation({
    implementation: AuditLogUserAfterDeleteHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
