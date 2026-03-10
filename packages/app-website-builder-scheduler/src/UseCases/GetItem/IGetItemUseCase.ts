import type { IWbSchedulerGetExecuteParams } from "~/Gateways/index.js";

export interface IGetItemUseCase {
    execute: (params: Omit<IWbSchedulerGetExecuteParams, "modelId">) => Promise<void>;
}
