import zod from "zod";
import type {
    CmsEntryListSortAsc,
    CmsEntryListSortDesc
} from "@webiny/api-headless-cms/types/index.js";
import { type DateOnType, ScheduleType } from "~/scheduler/types.js";
import { dateToISOString } from "~/scheduler/dates.js";

export const getScheduleSchema = zod.object({
    modelId: zod.string(),
    id: zod.string()
});

const publishAndUnpublishSchemaType = zod.nativeEnum(ScheduleType);

export const listScheduleSchema = zod.object({
    modelId: zod.string(),
    where: zod
        .object({
            targetId: zod.string().optional(),
            targetEntryId: zod.string().optional(),
            title_contains: zod.string().optional(),
            title_not_contains: zod.string().optional(),
            type: publishAndUnpublishSchemaType.optional(),
            scheduledBy: zod.string().optional(),
            scheduledOn: zod
                .date()
                .optional()
                .transform(value => {
                    if (!value) {
                        return undefined;
                    }
                    return dateToISOString(value);
                }),
            scheduledOn_gte: zod
                .date()
                .optional()
                .transform(value => {
                    if (!value) {
                        return undefined;
                    }
                    return dateToISOString(value);
                }),
            scheduledOn_lte: zod
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

const dateOnSchema = zod
    .date()
    .optional()
    .transform<DateOnType | undefined>(value => {
        return value instanceof Date ? value : undefined;
    });

const schedulerInputSchema = zod.discriminatedUnion("immediately", [
    zod.object({
        immediately: zod.literal(true),
        scheduleOn: zod.never().optional(),
        dateOn: zod.date().optional(),
        type: publishAndUnpublishSchemaType
    }),
    zod.object({
        immediately: zod.literal(false).optional(),
        scheduleOn: zod.date().or(
            zod.string().transform(value => {
                return new Date(value);
            })
        ),
        dateOn: dateOnSchema,
        type: publishAndUnpublishSchemaType
    })
]);

export const createScheduleSchema = zod.object({
    modelId: zod.string(),
    id: zod.string(),
    input: schedulerInputSchema
});

export const updateScheduleSchema = zod.object({
    modelId: zod.string(),
    id: zod.string(),
    input: schedulerInputSchema
});

export const cancelScheduleSchema = zod.object({
    modelId: zod.string(),
    id: zod.string()
});
