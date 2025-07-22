import type { Plugin } from "@webiny/plugins/types.js";
import type { ICreateHeadlessCmsSchedulerContextParams } from "~/context.js";
import { createHeadlessCmsScheduleContext } from "~/context.js";
import { createSchedulerModel } from "~/scheduler/model.js";
import { createSchedulerGraphQL } from "~/graphql/index.js";
import { createScheduledCmsActionEventHandler } from "~/handler/index.js";

export interface ICreateHeadlessCmsScheduleParams extends ICreateHeadlessCmsSchedulerContextParams {
    //
}

/**
 * This will register both API and Handler plugins for the Headless CMS Scheduler.
 * * Handler plugin will handle the scheduled CMS action event - a lambda call from the EventBridge Scheduler.
 * * API plugin will provide the GraphQL API and code for managing the scheduled CMS actions.
 */
export const createHeadlessCmsSchedule = (params: ICreateHeadlessCmsScheduleParams): Plugin[] => {
    return [
        /**
         * Handler for the Scheduled CMS Action Event.
         */
        createScheduledCmsActionEventHandler(),
        /**
         * API side of the scheduler.
         */
        createSchedulerModel(),
        createHeadlessCmsScheduleContext(params),
        createSchedulerGraphQL()
    ];
};
