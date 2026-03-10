import type { IWbSchedulerGetExecuteParams } from "~/Gateways/index.js";

export interface IGetItemController {
    execute: (params: Omit<IWbSchedulerGetExecuteParams, "modelId">) => Promise<void>;
}
