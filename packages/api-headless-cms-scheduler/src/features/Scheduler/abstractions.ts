import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { createAbstraction } from "@webiny/feature/api";
import type { IScheduler } from "~/scheduler/types.js";

export interface ISchedulerFactory {
    useModel(model: CmsModel): IScheduler;
}

export const SchedulerFactory = createAbstraction<ISchedulerFactory>("SchedulerFactory");

export namespace SchedulerFactory {
    export type Interface = ISchedulerFactory;
}
