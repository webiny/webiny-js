import type { Plugin } from "@webiny/plugins/types.js";
import { SchedulerClient, SchedulerClientConfig } from "@webiny/aws-sdk/client-scheduler/index.js";
import { createSchedulerContext } from "~/context.js";

export interface ICreateSchedulerParams {
    getClient(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
}

export const createScheduler = (params: ICreateSchedulerParams): Plugin[] => {
    return [...createSchedulerContext(params)];
};
