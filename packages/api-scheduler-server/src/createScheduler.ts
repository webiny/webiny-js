import type { Plugin } from "@webiny/plugins/types.js";
import { createServerSchedulerContext } from "~/context.js";

export const createScheduler = (): Plugin[] => {
    return [...createServerSchedulerContext()];
};
