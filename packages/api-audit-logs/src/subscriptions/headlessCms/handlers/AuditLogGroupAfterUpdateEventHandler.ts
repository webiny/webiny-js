import WebinyError from "@webiny/error";
import { GroupAfterUpdateEventHandler } from "@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/index.js";
import { AUDIT } from "~/config.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";

class AuditLogGroupAfterUpdateEventHandlerImpl implements GroupAfterUpdateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: GroupAfterUpdateEventHandler.Event): Promise<void> {
        const { group, original } = event.payload;

        try {
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.HEADLESS_CMS.GROUP.UPDATE,
                message: "Group updated",
                content: { before: original, after: group },
                entityId: group.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogGroupAfterUpdateEventHandler",
                code: "AUDIT_LOGS_AFTER_GROUP_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogGroupAfterUpdateEventHandler =
    GroupAfterUpdateEventHandler.createImplementation({
        implementation: AuditLogGroupAfterUpdateEventHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
