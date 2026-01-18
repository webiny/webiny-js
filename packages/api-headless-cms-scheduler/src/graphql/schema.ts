import zod from "zod";
import type {
    CmsEntryListSortAsc,
    CmsEntryListSortDesc
} from "@webiny/api-headless-cms/types/index.js";
import { dateToISOString } from "./dates.js";

export const getScheduleSchema = zod.object({
    modelId: zod.string(),
    id: zod.string()
});

export enum ScheduleType {
    publish = "publish",
    unpublish = "unpublish"
}

const publishAndUnpublishSchemaType = zod.nativeEnum(ScheduleType);

export const listScheduleSchema = zod.object({
    modelId: zod.string(),
    where: zod
        .object({
            targetId: zod.string().optional(),
            namespace: zod.string().optional(),
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
            zod.string().refine((value): value is CmsEntryListSortAsc | CmsEntryListSortDesc => {
                const [field, direction] = value.split("_");
                if (!field) {
                    return false;
                } else if (direction !== "ASC" && direction !== "DESC") {
                    return false;
                }
                return true;
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
        modelId: zod.string(),
        id: zod.string()
    })
);

export const updateScheduleSchema = schedulerInputSchema.and(
    zod.object({
        modelId: zod.string(),
        id: zod.string()
    })
);

export const cancelScheduleSchema = zod.object({
    modelId: zod.string(), // TODO: remove this; not needed as schedule ID already has model encoded
    id: zod.string()
});
