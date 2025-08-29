import WebinyError from "@webiny/error";
import type { AuditAction, AuditLogPayload, AuditLogsContext } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";
import type { GenericRecord } from "@webiny/api/types.js";

interface CreateAuditLogParams {
    context: Pick<AuditLogsContext, "auditLogs">;
    payload: AuditLogPayload;
}

const createAuditLog = async (params: CreateAuditLogParams): Promise<IAuditLog> => {
    const { context, payload } = params;

    try {
        return await context.auditLogs.createAuditLog(payload);
    } catch (error) {
        throw WebinyError.from(error);
    }
};

interface CreateOrMergeAuditLogParams {
    context: AuditLogsContext;
    payload: AuditLogPayload;
    delay: number;
}

const createAuditLogDelayDate = (delay: number | undefined) => {
    if (!delay) {
        return undefined;
    }
    const date = new Date();
    date.setTime(date.getTime() - delay * 1000);
    return date;
};

const createOrMergeAuditLog = async (params: CreateOrMergeAuditLogParams): Promise<IAuditLog> => {
    const { context, payload, delay } = params;

    const results = await context.auditLogs.listAuditLogs({
        app: payload.app,
        entryId: payload.entityId,
        limit: 1,
        createdOn_gte: createAuditLogDelayDate(delay),
        sort: "DESC"
    });
    if (results.error) {
        throw WebinyError.from(results.error);
    }
    const original = results.items?.[0];
    if (!original) {
        return createAuditLog(params);
    }
    // Update latest audit log with new "after" payload.
    const beforePayloadData = original.content ? JSON.parse(original.content)?.before : undefined;
    /**
     * We can assume that there is a possible "after" in the payload data.
     */
    const afterPayloadData = payload.content?.after;
    const updatedPayloadData = beforePayloadData
        ? {
              before: beforePayloadData,
              after: afterPayloadData
          }
        : payload.content;

    try {
        return await context.auditLogs.updateAuditLog(original, {
            ...payload,
            content: updatedPayloadData
        });
    } catch (ex) {
        throw WebinyError.from(ex);
    }
};

export const getAuditConfig = (audit: AuditAction) => {
    return async (
        message: string,
        content: GenericRecord,
        entityId: string,
        context: AuditLogsContext
    ): Promise<IAuditLog | null> => {
        if (!context.auditLogs) {
            console.log("No AuditLogs defined.");
            return null;
        }

        const payload: AuditLogPayload = {
            message,
            app: audit.app.app,
            entityId,
            entity: audit.entity.type,
            action: audit.action.type,
            content,
            tags: []
        };

        const delay = audit.action.newEntryDelay || 0;

        // Check if there is delay on audit log creation for this action.
        if (delay > 0) {
            try {
                return await createOrMergeAuditLog({
                    context,
                    payload,
                    delay
                });
            } catch {
                // Don't care at this point!
            }
            return null;
        }
        return await createAuditLog({
            context,
            payload
        });
    };
};
