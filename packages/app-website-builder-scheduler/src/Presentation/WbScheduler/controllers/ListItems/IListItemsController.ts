import type { IWbSchedulerListExecuteParams } from "~/Gateways/index.js";

export interface IListItemsController {
    execute: (params?: Omit<IWbSchedulerListExecuteParams, "modelId">) => Promise<void>;
}
