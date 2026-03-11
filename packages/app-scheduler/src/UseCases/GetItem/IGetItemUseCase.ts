import type { ISchedulerGetExecuteParams } from "~/Gateways/index.js";

export interface IGetItemUseCase {
    execute: (params: ISchedulerGetExecuteParams) => Promise<void>;
}
