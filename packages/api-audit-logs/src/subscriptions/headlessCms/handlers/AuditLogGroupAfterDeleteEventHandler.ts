import WebinyError from "@webiny/error";
import { GroupAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/index.js";
import { AUDIT } from "~/config.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";

class AuditLogGroupAfterDeleteHandlerEventImpl implements GroupAfterDeleteEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: GroupAfterDeleteEventHandler.Event): Promise<void> {
        const { group } = event.payload;

        try {
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.HEADLESS_CMS.GROUP.DELETE,
                message: "Group deleted",
                content: group,
                entityId: group.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogGroupAfterDeleteHandlerEvent",
                code: "AUDIT_LOGS_AFTER_GROUP_DELETE_HANDLER"
            });
        }
    }
}

export const AuditLogGroupAfterDeleteEventHandler =
    GroupAfterDeleteEventHandler.createImplementation({
        implementation: AuditLogGroupAfterDeleteHandlerEventImpl,
        dependencies: [RecordAuditLogUseCase]
    });
