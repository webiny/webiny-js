import type { Plugin } from "@webiny/plugins/types.js";
import type { SchedulerClientConfig } from "@webiny/aws-sdk/client-scheduler/index.js";
import { createAwsSchedulerContext } from "~/context.js";
import { createScheduledActionEventHandler } from "~/createEventHandler.js";

export interface ICreateSchedulerParams {
    getClient(
        config?: SchedulerClientConfig
    ): Pick<import("@webiny/aws-sdk/client-scheduler/index.js").SchedulerClient, "send">;
}

export const createScheduler = (params: ICreateSchedulerParams): Plugin[] => {
    return [createScheduledActionEventHandler(), ...createAwsSchedulerContext(params)];
};
