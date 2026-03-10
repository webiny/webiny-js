import type { WbSchedulerEntry } from "~/types.js";

/**
 * Note: `modelId` is present for interface compatibility with the scheduler gateway pattern.
 * WB implementations always use the single page model — `modelId` is ignored by all adapters.
 */
export interface IWbSchedulerGetExecuteParams {
    modelId: string;
    id: string;
}

export type IWbSchedulerGetGatewayResponse = WbSchedulerEntry | null;

export interface IWbSchedulerGetGateway {
    execute(params: IWbSchedulerGetExecuteParams): Promise<IWbSchedulerGetGatewayResponse>;
}
