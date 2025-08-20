import WebinyError from "@webiny/error";
import { mdbid } from "@webiny/utils";
import type { IAcoApp, SearchRecord } from "@webiny/api-aco/types";
import type { AuditAction, AuditLogPayload, AuditLogsContext, AuditLogValues } from "~/types";
import type { GenericRecord } from "@webiny/api/types";

interface CreateAuditLogParams<T = GenericRecord> {
    app: IAcoApp<AuditLogsContext>;
    payload: AuditLogPayload<T>;
    deleteLogsAfterDays: number | undefined;
}

const createAuditLog = async <T = GenericRecord>(params: CreateAuditLogParams<T>) => {
    const { app, payload: input, deleteLogsAfterDays } = params;

    const compressor = app.context.compressor;

    const expiresAtObj = createExpiresAt(deleteLogsAfterDays);

    const payload = structuredClone(input);

    try {
        await app.context.auditLogsAco.onBeforeCreate.publish({
            /**
             * We will assume that the payload is structured correctly.
             */
            // @ts-expect-error
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
        return values;
    } catch (error) {
        throw WebinyError.from(error, {
            message: "Error while creating new audit log",
            code: "CREATE_AUDIT_LOG"
        });
    }
};

interface CreateOrMergeAuditLogParams<T = GenericRecord> {
    app: IAcoApp<AuditLogsContext>;
    payload: AuditLogPayload<T>;
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

interface IShouldCreateNewAuditLogParams<T = GenericRecord> {
    original?: SearchRecord<AuditLogPayload<T>>;
    payload: AuditLogPayload<T>;
    delay: number;
}

const shouldCreateNewAuditLog = <T = GenericRecord>(
    params: IShouldCreateNewAuditLogParams<T>
): boolean => {
    const { original, payload, delay } = params;
    if (!original) {
        return true;
    }
    const existingLogDate = Date.parse(original.savedOn);
    const newLogDate = new Date(payload.timestamp).getTime();
    if (newLogDate - existingLogDate < delay * 1000) {
        return false;
    }
    return true;
};

const createOrMergeAuditLog = async <T = GenericRecord>(params: CreateOrMergeAuditLogParams<T>) => {
    const { app, payload, delay, deleteLogsAfterDays } = params;

    const expireAtObj = createExpiresAt(deleteLogsAfterDays);

    const compressor = app.context.compressor;
    // Get the latest audit log of this entry.
    const [records] = await app.search.list<AuditLogPayload<T>>({
        where: {
            type: "AuditLogs",
            data: {
                entityId: payload.entityId,
                initiator: payload.initiator
            }
        },
        limit: 1
    });
    const original = records[0] as SearchRecord<AuditLogPayload<T>>;

    if (shouldCreateNewAuditLog<T>({ original, payload, delay })) {
        return createAuditLog(params);
    }
    // Update latest audit log with new "after" payload.
    // @ts-expect-error
    const beforePayloadData = JSON.parse(original?.data.data)?.before;
    /**
     * We can assume that there is a possible "after" in the payload data.
     */
    // @ts-expect-error
    const afterPayloadData = payload.data?.after;
    const updatedPayloadData = beforePayloadData
        ? JSON.stringify({
              before: beforePayloadData,
              after: afterPayloadData
          })
        : JSON.stringify(payload.data);

    await app.context.auditLogsAco.onBeforeUpdate.publish({
        payload: payload as AuditLogPayload,
        original: original.data as AuditLogPayload,
        context: app.context,
        setPayload(input) {
            Object.assign(payload, input);
        }
    });

    const data = await compressor.compress(updatedPayloadData);
    try {
        await app.search.update(original.id, {
            data: {
                ...payload,
                data: JSON.stringify(data)
            },
            ...expireAtObj
        });

        return {
            ...original,
            data: updatedPayloadData,
            ...expireAtObj
        };
    } catch (error) {
        throw WebinyError.from(error, {
            message: "Error while updating audit log",
            code: "UPDATE_AUDIT_LOG"
        });
    }
};

export const getAuditConfig = (audit: AuditAction) => {
    return async <T = GenericRecord>(
        message: string,
        data: T,
        entityId: string,
        context: AuditLogsContext
    ) => {
        const { aco, security } = context;

        if (!aco) {
            console.log("No ACO defined.");
            return;
        }

        const identity = security.getIdentity();

        const auditLogPayload: AuditLogPayload<T> = {
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
        const delay = audit.action.newEntryDelay || 0;

        // Check if there is delay on audit log creation for this action.
        if (delay > 0) {
            try {
                return await createOrMergeAuditLog<T>({
                    app,
                    payload: auditLogPayload,
                    delay,
                    deleteLogsAfterDays: context.auditLogsAco.deleteLogsAfterDays
                });
            } catch {
                // Don't care at this point!
            } finally {
                return null;
            }
        }
        return await createAuditLog<T>({
            app,
            payload: auditLogPayload,
            deleteLogsAfterDays: context.auditLogsAco.deleteLogsAfterDays
        });
    };
};
