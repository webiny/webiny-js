import type { Plugin } from "@webiny/plugins/types.js";
import type { ICreateHeadlessCmsSchedulerContextParams } from "~/context.js";
import { createHeadlessCmsScheduleContext } from "~/context.js";
import { createSchedulerModel } from "~/scheduler/model.js";
import { createSchedulerGraphQL } from "~/graphql/index.js";

export interface ICreateHeadlessCmsScheduleParams extends ICreateHeadlessCmsSchedulerContextParams {
    //
}

export const createHeadlessCmsSchedule = (params: ICreateHeadlessCmsScheduleParams): Plugin[] => {
    return [
        createSchedulerModel(),
        createHeadlessCmsScheduleContext(params),
        createSchedulerGraphQL()
    ];
};
