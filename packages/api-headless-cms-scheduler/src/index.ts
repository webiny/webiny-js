import { createHeadlessCmsScheduleContext } from "~/context.js";
import { ContextPlugin } from "@webiny/api";

export const createHeadlessCmsScheduler = (): ContextPlugin[] => {
    return [createHeadlessCmsScheduleContext()];
};

export { SchedulePublishEntryUseCase } from "~/features/SchedulePublishEntryUseCase/abstractions.js";
export { ScheduleUnpublishEntryUseCase } from "~/features/ScheduleUnpublishEntryUseCase/abstractions.js";
