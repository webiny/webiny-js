import type { Plugin } from "@webiny/plugins/types.js";
import { registerSchedulerExtension } from "~/context.js";

/** @deprecated use SchedulerFeature.register() + registerSchedulerAwsExtension() from @webiny/api-scheduler-aws */
export const createScheduler = (): Plugin[] => {
    return [...registerSchedulerExtension()];
};
