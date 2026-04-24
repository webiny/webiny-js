import type { Plugin } from "@webiny/plugins/types.js";
import { SchedulerClient, SchedulerClientConfig } from "@webiny/aws-sdk/client-scheduler/index.js";
import { createSchedulerContext } from "~/context.js";
import { createScheduledActionEventHandler } from "~/createEventHandler.js";

export interface ICreateSchedulerParams {
    getClient(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
}
export const createScheduler = (params: ICreateSchedulerParams): Plugin[] => {
    return [
        /**
         * Handler for the Scheduled Action Event.
         */
        createScheduledActionEventHandler(),
        createSchedulerContext(params)
    ];
};
