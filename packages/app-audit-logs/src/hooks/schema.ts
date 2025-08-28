import zod from "zod";
import { ActionType } from "~/types.js";

export const auditLogSchema = zod.object({
    id: zod.string(),
    createdBy: zod.object({
        id: zod.string(),
        displayName: zod.string().optional(),
        type: zod.string().optional()
    }),
    createdOn: zod.preprocess(value => {
        if (typeof value === "string" || value instanceof Date) {
            return new Date(value);
        }
        return value;
    }, zod.date()),
    app: zod.string(),
    action: zod.nativeEnum(ActionType),
    message: zod.string(),
    entity: zod.string(),
    entityId: zod.string(),
    tags: zod.array(zod.string()),
    expiresAt: zod
        .preprocess(value => {
            if (typeof value === "string" || value instanceof Date) {
                return new Date(value);
            }
            return undefined;
        }, zod.date().optional().nullish())
        .optional()
        .nullish()
        .transform(value => {
            return value || undefined;
        }),
    content: zod.string()
});

export const listAuditLogsSchema = zod.array(auditLogSchema);
