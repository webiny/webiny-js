import WebinyError from "@webiny/error";
import { mdbid } from "@webiny/utils";
import { IAcoApp } from "@webiny/api-aco/types";
import { AuditAction, AuditLog, AuditLogsContext } from "~/types";
import { compressor } from "~/utils/compressor";

interface AuditLogPayload extends Omit<AuditLog, "id" | "data"> {
    data: Record<string, any>;
}

interface CreateAuditLogParams {
    app: IAcoApp;
    payload: AuditLogPayload;
}

const createAuditLog = async (params: CreateAuditLogParams) => {
    const { app, payload } = params;

    const payloadData = JSON.stringify(payload.data);

    try {
        const entry = {
            id: mdbid(),
            title: payload.message,
            content: payload.message,
            tags: [],
            type: "AuditLogs",
            location: { folderId: "root" },
            data: {
                ...payload,
                data: payloadData
            }
        };
        await app.search.create({
            ...entry,
            data: {
                ...entry.data,
                data: await compressor.compress(entry.data.data)
            }
        });
        return entry;
    } catch (error) {
        throw WebinyError.from(error, {
            message: "Error while creating new audit log",
            code: "CREATE_AUDIT_LOG"
        });
    }
};

interface CreateOrMergeAuditLogParams {
    app: IAcoApp;
    payload: AuditLogPayload;
    delay: number;
}

const createOrMergeAuditLog = async (params: CreateOrMergeAuditLogParams) => {
    const { app, payload, delay } = params;
    // Get the latest audit log of this entry.
    const [records] = await app.search.list({
        where: {
            type: "AuditLogs",
            data: {
                entityId: payload.entityId,
                initiator: payload.initiator
            }
        },
        limit: 1
    });
    const existingLog = records?.[0];

    if (existingLog) {
        const existingLogDate = Date.parse(existingLog.savedOn);
        const newLogDate = payload.timestamp.getTime();

        // Check if the latest audit log is saved within delay range.
        if (newLogDate - existingLogDate < delay * 1000) {
            const existingLogData = await compressor.decompress(existingLog.data as any);
            // Update latest audit log with new "after" payload.
            const beforePayloadData = JSON.parse(existingLogData?.data.data)?.before;
            const afterPayloadData = payload.data?.after;
            const updatedPayloadData = beforePayloadData
                ? JSON.stringify({ before: beforePayloadData, after: afterPayloadData })
                : JSON.stringify(payload.data);

            const data = await compressor.compress(updatedPayloadData);
            try {
                await app.search.update(existingLog.id, {
                    data: {
                        ...payload,
                        data
                    }
                });

                return {
                    ...existingLog,
                    data: updatedPayloadData
                };
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while updating audit log",
                    code: "UPDATE_AUDIT_LOG"
                });
            }
        }
    }

    return createAuditLog(params);
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
            console.log("No ACO defined.");
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
            return await createOrMergeAuditLog({
                app,
                payload: auditLogPayload,
                delay
            });
        }
        return await createAuditLog({
            app,
            payload: auditLogPayload
        });
    };
};
