import type { ISchedulerGetExecuteParams } from "~/Gateways/index.js";

export interface IGetItemController {
    execute: (params: Omit<ISchedulerGetExecuteParams, "modelId">) => Promise<void>;
}
