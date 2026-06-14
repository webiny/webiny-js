import type { Plugin } from "@webiny/plugins/types.js";
import { createSchedulerContext, type ICreateSchedulerContextParams } from "~/context.js";

export const createScheduler = (params?: ICreateSchedulerContextParams): Plugin[] => {
    return [...createSchedulerContext(params)];
};
