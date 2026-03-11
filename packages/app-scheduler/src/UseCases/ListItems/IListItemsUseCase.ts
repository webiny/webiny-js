import type { ISchedulerListExecuteParams } from "~/Gateways/index.js";

export interface IListItemsUseCase {
    execute: (params?: Omit<ISchedulerListExecuteParams, "app">) => Promise<void>;
}
