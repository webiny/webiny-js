import { mdbid } from "@webiny/utils";
import { AuditAction } from "~/utils/getAuditObject";
import { AuditLogsContext } from "~/types";

export const getAuditConfig = (audit: AuditAction) => {
    return async (
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

        const app = aco.getApp("AuditLogs");
        const delay = audit.action.newEntryDelay;

        // Check if there is delay on audit log creation for this action.
        if (delay) {
            // Get the latest audit log of this entry.
            const [records] = await app.search.list({
                where: { type: "AuditLogs", data: { entityId, initiator: identity.id } },
                limit: 1
            });
            const existingLog = records?.[0];

            if (existingLog) {
                // Check if the latest audit log is saved within delay range.
                const existingLogDate = Date.parse(existingLog.savedOn);
                const newLogDate = auditLogPayload.timestamp.getTime();

                if (newLogDate - existingLogDate < delay * 1000) {
                    // Update latest audit log with new "after" payload.
                    const beforePayloadData = JSON.parse(existingLog.data.data)?.before;
                    const updatedPayloadData = beforePayloadData
                        ? JSON.stringify({ before: beforePayloadData, after: data.after })
                        : auditLogPayload.data;

                    await app.search.update(existingLog.id, {
                        data: {
                            ...auditLogPayload,
                            data: updatedPayloadData
                        }
                    });

                    return;
                }
            }
        }

        await app.search.create({
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
