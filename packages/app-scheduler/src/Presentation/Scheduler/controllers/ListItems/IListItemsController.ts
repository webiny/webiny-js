import type { ISchedulerListExecuteParams } from "~/Gateways/index.js";

export interface IListItemsController {
    execute: (params?: Omit<ISchedulerListExecuteParams, "app">) => Promise<void>;
}
