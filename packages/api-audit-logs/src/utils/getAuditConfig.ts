import WebinyError from "@webiny/error";
import { mdbid } from "@webiny/utils";
import type { IAcoApp } from "@webiny/api-aco/types";
import type { AuditAction, AuditLogPayload, AuditLogsContext, AuditLogValues } from "~/types";
import type { GenericRecord } from "@webiny/api/types";

interface CreateAuditLogParams {
    app: IAcoApp<AuditLogsContext>;
    payload: AuditLogPayload;
    deleteLogsAfterDays: number | undefined;
}

const createAuditLog = async (params: CreateAuditLogParams) => {
    const { app, payload: input, deleteLogsAfterDays } = params;

    const compressor = app.context.compressor;

    const expiresAtObj = createExpiresAt(deleteLogsAfterDays);

    const payload = structuredClone(input);

    try {
        await app.context.auditLogsAco.onBeforeCreate.publish({
            payload,
            setPayload(values) {
                Object.assign(payload, values);
            },
            context: app.context
        });
        const values: AuditLogValues = {
            id: mdbid(),
            title: payload.message,
            content: payload.message,
            tags: [],
            type: "AuditLogs",
            location: {
                folderId: "root"
            },
            data: {
                ...payload,
                data: JSON.stringify(payload.data)
            },
            ...expiresAtObj
        };

        const data = await compressor.compress(values.data.data);
        const entry = {
            ...values,
            data: {
                ...values.data,
                data: JSON.stringify(data)
            }
        };
        await app.search.create(entry);
        return entry;
    } catch (error) {
        throw WebinyError.from(error, {
            message: "Error while creating new audit log",
            code: "CREATE_AUDIT_LOG"
        });
    }
};

interface CreateOrMergeAuditLogParams {
    app: IAcoApp<AuditLogsContext>;
    payload: AuditLogPayload;
    delay: number;
    deleteLogsAfterDays: number | undefined;
}

const createExpiresAt = (deleteLogsAfterDays: number | undefined) => {
    if (!deleteLogsAfterDays || deleteLogsAfterDays <= 0) {
        return {};
    }
    return {
        expireAt: Math.floor(Date.now() + (deleteLogsAfterDays * 24 * 60 * 60 * 1000) / 1000)
    };
};

const createOrMergeAuditLog = async (params: CreateOrMergeAuditLogParams) => {
    const { app, payload, delay, deleteLogsAfterDays } = params;

    const expireAtObj = createExpiresAt(deleteLogsAfterDays);

    const compressor = app.context.compressor;
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
        const newLogDate = new Date(payload.timestamp).getTime();

        // Check if the latest audit log is saved within delay range.
        if (newLogDate - existingLogDate < delay * 1000) {
            const existingLogData = (await compressor.decompress(
                existingLog.data
            )) as unknown as GenericRecord;
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
                    },
                    ...expireAtObj
                });

                return {
                    ...existingLog,
                    data: updatedPayloadData,
                    ...expireAtObj
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

        const auditLogPayload: AuditLogPayload = {
            message,
            app: audit.app.app,
            entity: audit.entity.type,
            entityId,
            action: audit.action.type,
            data,
            timestamp: new Date().toISOString(),
            initiator: identity?.id
        };

        const app = aco.getApp<AuditLogsContext>("AuditLogs");
        const delay = audit.action.newEntryDelay;

        // Check if there is delay on audit log creation for this action.
        if (delay) {
            try {
                return await createOrMergeAuditLog({
                    app,
                    payload: auditLogPayload,
                    delay,
                    deleteLogsAfterDays: context.auditLogsAco.deleteLogsAfterDays
                });
            } catch {
                // Don't care at this point!
            } finally {
                return JSON.stringify({});
            }
        }
        return await createAuditLog({
            app,
            payload: auditLogPayload,
            deleteLogsAfterDays: context.auditLogsAco.deleteLogsAfterDays
        });
    };
};
