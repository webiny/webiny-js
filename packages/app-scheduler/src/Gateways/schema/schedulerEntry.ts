import zod from "zod";
import { ScheduleType } from "~/types.js";

export const schedulerEntrySchema = zod.object({
    id: zod.string(),
    targetId: zod.string(),
    app: zod.string(),
    scheduledBy: zod.object({
        id: zod.string(),
        displayName: zod.string(),
        type: zod.string()
    }),
    publishOn: zod
        .string()
        .nullable()
        .optional()
        .transform(value => {
            return !!value ? new Date(value) : undefined;
        }),
    unpublishOn: zod
        .string()
        .nullable()
        .optional()
        .transform(value => {
            return !!value ? new Date(value) : undefined;
        }),
    type: zod.nativeEnum(ScheduleType),
    title: zod.string()
});
