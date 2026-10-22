import WebinyError from "@webiny/error";
import { UserAfterUpdateEventHandler } from "@webiny/api-core/features/users/UpdateUser/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogUserAfterUpdateHandlerImpl implements UserAfterUpdateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: UserAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { updatedUser, originalUser } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.SECURITY.USER.UPDATE,
                message: "User updated",
                content: { before: originalUser, after: updatedUser },
                entityId: updatedUser.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogUserAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_USER_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogUserAfterUpdateHandler = UserAfterUpdateEventHandler.createImplementation({
    implementation: AuditLogUserAfterUpdateHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
