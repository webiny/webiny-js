import WebinyError from "@webiny/error";
import { GroupAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/events.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogGroupAfterDeleteHandler implements GroupAfterDeleteHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: GroupAfterDeleteHandler.Event): Promise<void> {
        const { group } = event.payload;

        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.GROUP.DELETE);

            await createAuditLog("Group deleted", group, group.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogGroupAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_GROUP_DELETE_HANDLER"
            });
        }
    }
}
