import WebinyError from "@webiny/error";
import { GroupAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/index.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AuditLogRecorder } from "~/abstractions.js";

class AuditLogGroupAfterCreateEventHandlerImpl implements GroupAfterCreateEventHandler.Interface {
    constructor(private recorder: AuditLogRecorder.Interface) {}

    async handle(event: GroupAfterCreateEventHandler.Event): Promise<void> {
        const { group } = event.payload;

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.GROUP.CREATE);

            await createAuditLog("Group created", group, group.id, this.recorder);
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
        dependencies: [AuditLogRecorder]
    });
