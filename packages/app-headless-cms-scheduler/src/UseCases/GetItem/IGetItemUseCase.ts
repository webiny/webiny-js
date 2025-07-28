import type { ISchedulerGetExecuteParams } from "~/Gateways/index.js";

export interface IGetItemUseCase {
    execute: (params: Omit<ISchedulerGetExecuteParams, "modelId">) => Promise<void>;
}
