import zod from "zod";
import { dateToISOString } from "./dates.js";

export const getScheduleSchema = zod.object({
    id: zod.string()
});

export enum ScheduleType {
    publish = "publish",
    unpublish = "unpublish"
}

const publishAndUnpublishSchemaType = zod.nativeEnum(ScheduleType);

export const listScheduleSchema = zod.object({
    where: zod
        .object({
            targetId: zod.string().optional(),
            title_contains: zod.string().optional(),
            title_not_contains: zod.string().optional(),
            type: publishAndUnpublishSchemaType.optional(),
            scheduledBy: zod.string().optional(),
            scheduledFor: zod
                .date()
                .optional()
                .transform(value => {
                    if (!value) {
                        return undefined;
                    }
                    return dateToISOString(value);
                }),
            scheduledFor_gte: zod
                .date()
                .optional()
                .transform(value => {
                    if (!value) {
                        return undefined;
                    }
                    return dateToISOString(value);
                }),
            scheduledFor_lte: zod
                .date()
                .optional()
                .transform(value => {
                    if (!value) {
                        return undefined;
                    }
                    return dateToISOString(value);
                })
        })
        .optional(),
    sort: zod
        .array(
            zod
                .string()
                .refine((value): value is string => {
                    const [field, direction] = value.split("_");
                    if (!field) {
                        return false;
                    } else if (direction !== "ASC" && direction !== "DESC") {
                        return false;
                    }
                    return true;
                })
                .transform(value => {
                    if (!value) {
                        return value;
                    }
                    return `values_${value}`;
                })
        )
        .optional(),
    limit: zod.number().optional(),
    after: zod.string().optional()
});

const schedulerInputSchema = zod.discriminatedUnion("immediately", [
    zod.object({
        immediately: zod.literal(true),
        scheduleFor: zod.never().optional(),
        type: publishAndUnpublishSchemaType
    }),
    zod.object({
        immediately: zod.literal(false).optional(),
        scheduleFor: zod.date().or(
            zod.string().transform(value => {
                return new Date(value);
            })
        ),
        type: publishAndUnpublishSchemaType
    })
]);

export const createScheduleSchema = schedulerInputSchema.and(
    zod.object({
        id: zod.string()
    })
);

export const updateScheduleSchema = schedulerInputSchema.and(
    zod.object({
        id: zod.string()
    })
);

export const cancelScheduleSchema = zod.object({
    id: zod.string()
});
