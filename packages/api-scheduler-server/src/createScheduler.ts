import type { Plugin } from "@webiny/plugins/types.js";
import { createSchedulerContext } from "~/context.js";

export const createScheduler = (): Plugin[] => {
    return [...createSchedulerContext()];
};
