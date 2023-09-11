import { mdbid } from "@webiny/utils";
import { IAcoApp } from "@webiny/api-aco/types";
import WebinyError from "@webiny/error";

import { AuditAction } from "~/utils/getAuditObject";
import { AuditLogsContext, AuditLog } from "~/types";

type AuditLogPayload = Omit<AuditLog, "id" | "data"> & {
    data: Record<string, any>;
};

const createAuditLog = async (app: IAcoApp, payload: AuditLogPayload) => {
    const payloadData = JSON.stringify(payload.data);

    try {
        await app.search.create({
            id: mdbid(),
            title: payload.message,
            content: payload.message,
            tags: [],
            type: "AuditLogs",
            location: { folderId: "root" },
            data: { ...payload, data: payloadData }
        });
    } catch (error) {
        throw WebinyError.from(error, {
            message: "Error while creating new audit log",
            code: "CREATE_AUDIT_LOG"
        });
    }
};

const createOrMergeAuditLog = async (app: IAcoApp, payload: AuditLogPayload, delay: number) => {
    // Get the latest audit log of this entry.
    const [records] = await app.search.list({
        where: {
            type: "AuditLogs",
            data: { entityId: payload.entityId, initiator: payload.initiator }
        },
        limit: 1
    });
    const existingLog = records?.[0];

    if (existingLog) {
        const existingLogDate = Date.parse(existingLog.savedOn);
        const newLogDate = payload.timestamp.getTime();

        // Check if the latest audit log is saved within delay range.
        if (newLogDate - existingLogDate < delay * 1000) {
            // Update latest audit log with new "after" payload.
            const beforePayloadData = JSON.parse(existingLog.data.data)?.before;
            const afterPayloadData = payload.data?.after;
            const updatedPayloadData = beforePayloadData
                ? JSON.stringify({ before: beforePayloadData, after: afterPayloadData })
                : JSON.stringify(payload.data);

            try {
                await app.search.update(existingLog.id, {
                    data: {
                        ...payload,
                        data: updatedPayloadData
                    }
                });

                return;
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while updating audit log",
                    code: "UPDATE_AUDIT_LOG"
                });
            }
        }
    }

    createAuditLog(app, payload);
};

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
            data,
            timestamp: new Date(),
            initiator: identity?.id
        };

        const app = aco.getApp("AuditLogs");
        const delay = audit.action.newEntryDelay;

        // Check if there is delay on audit log creation for this action.
        if (delay) {
            await createOrMergeAuditLog(app, auditLogPayload, delay);
        } else {
            await createAuditLog(app, auditLogPayload);
        }
    };
};
