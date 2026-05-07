import type { Plugin } from "@webiny/plugins/types.js";
import { SchedulerClient, SchedulerClientConfig } from "@webiny/aws-sdk/client-scheduler/index.js";
import { createSchedulerContext } from "~/context.js";
import type { ICreateSchedulerContextParams } from "~/context.js";
import { createScheduledActionEventHandler } from "~/createEventHandler.js";

export interface ICreateSchedulerParams extends ICreateSchedulerContextParams {
    /**
     * @deprecated Required only when `schedulerService` is omitted (legacy
     * AWS EventBridge Scheduler path). New consumers should pass
     * `schedulerService` directly — see `@webiny/api-scheduler-cron`.
     */
    getClient?(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
}

export const createScheduler = (params: ICreateSchedulerParams = {}): Plugin[] => {
    return [
        /**
         * Handler for the Scheduled Action Event.
         */
        createScheduledActionEventHandler(),
        createSchedulerContext(params)
    ];
};
