import zod from "zod";
import type {
    CmsEntryListSortAsc,
    CmsEntryListSortDesc
} from "@webiny/api-headless-cms/types/index.js";

export const getScheduleSchema = zod.object({
    modelId: zod.string(),
    id: zod.string()
});

const publishAndUnpublishSchemaType = zod.enum(["publish", "unpublish"]);

const immediatelySchema = zod.object({
    immediately: zod.literal(true),
    onDate: zod.never().optional(),
    type: publishAndUnpublishSchemaType
});

const dateOnSchema = zod.object({
    immediately: zod.never().optional(),
    dateOn: zod.union([zod.date(), zod.string().transform(value => new Date(value))]),
    type: publishAndUnpublishSchemaType
});

const inputSchema = zod.union([immediatelySchema, dateOnSchema]);

export const listScheduleSchema = zod.object({
    modelId: zod.string(),
    where: zod.object({
        targetId: zod.string().optional(),
        targetEntryId: zod.string().optional(),
        type: publishAndUnpublishSchemaType.optional(),
        scheduledBy: zod.string().optional(),
        dateOn: zod.date().optional(),
        dateOn_gte: zod.date().optional(),
        dateOn_lte: zod.date().optional()
    }),
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

export const createScheduleSchema = zod.object({
    modelId: zod.string(),
    id: zod.string(),
    input: inputSchema
});

export const updateScheduleSchema = zod.object({
    modelId: zod.string(),
    id: zod.string(),
    input: inputSchema
});

export const cancelScheduleSchema = zod.object({
    modelId: zod.string(),
    id: zod.string()
});
