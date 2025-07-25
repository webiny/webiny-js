import { CmsModel } from "@webiny/app-headless-cms-common/types/model.js";
import zod from "zod";
import { ScheduleType } from "@webiny/app-headless-cms-scheduler/types.js";

export const schedulerEntrySchema = zod.object({
    id: zod.string(),
    targetId: zod.string(),
    model: zod
        .object({
            modelId: zod.string()
        })
        .transform(value => {
            return value as unknown as Pick<CmsModel, "modelId">;
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
