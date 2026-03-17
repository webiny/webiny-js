import { createHeadlessCmsScheduleContext } from "~/context.js";
import { ContextPlugin } from "@webiny/api";

export const createHeadlessCmsScheduler = (): ContextPlugin[] => {
    return [createHeadlessCmsScheduleContext()];
};
