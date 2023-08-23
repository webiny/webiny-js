import { mdbid } from "@webiny/utils";
import { AuditAction } from "~/utils/getAuditObject";
import { AuditLogsContext } from "~/types";

export const getAuditConfig = (audit: AuditAction) => {
    return (
        message: string,
        data: Record<string, any>,
        entityId: string,
        context: AuditLogsContext
    ) => {
        const { aco, security } = context;

        if (!aco) {
            return;
        }

        const identity = security.getIdentity();

        const auditLogPayload = {
            message,
            app: audit.app.app,
            entity: audit.entity.type,
            entityId,
            action: audit.action.type,
            data: JSON.stringify(data),
            timestamp: new Date(),
            initiator: identity?.id
        };

        // context.auditLogs.createAuditLog(auditLogPayload);

        const app = aco.getApp("AuditLogs");
        app.search.create({
            id: mdbid(),
            title: message,
            content: message,
            tags: [],
            type: "AuditLogs",
            location: { folderId: "root" },
            data: auditLogPayload
        });
    };
};
