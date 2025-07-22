import { CmsModel } from "@webiny/app-headless-cms/types";
import zod from "zod";
import { ScheduleType } from "~/types.js";

export const scheduleEntrySchema = zod.object({
    id: zod.string(),
    targetId: zod.string(),
    model: zod
        .object({})
        .passthrough()
        .transform(value => {
            return value as unknown as CmsModel;
        }),
    scheduledBy: zod.object({
        id: zod.string(),
        displayName: zod.string(),
        type: zod.string()
    }),
    publishOn: zod.date().optional(),
    unpublishOn: zod.date().optional(),
    type: zod.nativeEnum(ScheduleType),
    title: zod.string()
});
