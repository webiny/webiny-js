import type { CmsContext, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import type { IScheduler } from "~/scheduler/types.js";

export interface CmsScheduleCallable {
    (model: CmsModel): IScheduler;
}

export interface CmsSchedule {
    scheduler: CmsScheduleCallable;
}

export interface ScheduleContext extends CmsContext {
    //
    cms: HeadlessCms & CmsSchedule;
}
