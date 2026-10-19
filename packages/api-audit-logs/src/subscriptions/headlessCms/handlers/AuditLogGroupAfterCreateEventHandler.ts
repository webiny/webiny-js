import WebinyError from "@webiny/error";
import { GroupAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/index.js";
import { AUDIT } from "~/config.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";

class AuditLogGroupAfterCreateEventHandlerImpl implements GroupAfterCreateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: GroupAfterCreateEventHandler.Event): Promise<void> {
        const { group } = event.payload;

        try {
            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.HEADLESS_CMS.GROUP.CREATE,
                message: "Group created",
                content: group,
                entityId: group.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogGroupAfterCreateEventHandler",
                code: "AUDIT_LOGS_AFTER_GROUP_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogGroupAfterCreateEventHandler =
    GroupAfterCreateEventHandler.createImplementation({
        implementation: AuditLogGroupAfterCreateEventHandlerImpl,
        dependencies: [RecordAuditLogUseCase]
    });
