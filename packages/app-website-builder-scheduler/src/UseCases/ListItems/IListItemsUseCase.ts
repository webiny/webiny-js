import type { IWbSchedulerListExecuteParams } from "~/Gateways/index.js";

export interface IListItemsUseCase {
    execute: (params?: Omit<IWbSchedulerListExecuteParams, "modelId">) => Promise<void>;
}
