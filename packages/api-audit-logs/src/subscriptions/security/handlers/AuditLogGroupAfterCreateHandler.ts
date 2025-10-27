import WebinyError from "@webiny/error";
import { GroupAfterCreateHandler } from "@webiny/api-security/features/groups/CreateGroup";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";

export class AuditLogGroupAfterCreateHandler implements GroupAfterCreateHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: GroupAfterCreateHandler.Event): Promise<void> {
        try {
            const { group } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.ROLE.CREATE);

            await createAuditLog("Role created", group, group.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogGroupAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_ROLE_CREATE_HANDLER"
            });
        }
    }
}
