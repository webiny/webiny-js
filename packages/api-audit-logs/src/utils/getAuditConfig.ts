import type { GenericRecord } from "@webiny/api/types.js";
import type { AuditLogRecorder } from "~/abstractions.js";
import type { AuditAction } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";

export const getAuditConfig = (audit: AuditAction) => {
    return async (
        message: string,
        content: GenericRecord,
        entityId: string,
        recorder: AuditLogRecorder.Interface
    ): Promise<IAuditLog | null> => {
        return recorder.record({
            audit,
            message,
            content,
            entityId
        });
    };
};
