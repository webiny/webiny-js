import WebinyError from "@webiny/error";
import { UserAfterCreateEventHandler } from "@webiny/api-core/features/users/CreateUser/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

class AuditLogUserAfterCreateHandlerImpl implements UserAfterCreateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: UserAfterCreateEventHandler.Event): Promise<void> {
        try {
            const { user } = event.payload;

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.SECURITY.USER.CREATE,
                message: "User created",
                content: user,
                entityId: user.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogUserAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_USER_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogUserAfterCreateHandler = UserAfterCreateEventHandler.createImplementation({
    implementation: AuditLogUserAfterCreateHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});
