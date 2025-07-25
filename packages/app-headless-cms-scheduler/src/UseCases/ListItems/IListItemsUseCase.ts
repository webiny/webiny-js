import type { ISchedulerListExecuteParams } from "~/Gateways/index.js";

export interface IListItemsUseCase {
    execute: (params?: Omit<ISchedulerListExecuteParams, "modelId">) => Promise<void>;
}
