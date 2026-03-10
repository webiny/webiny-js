import type { WbSchedulerEntry } from "~/types.js";

/**
 * Note: `modelId` is present for interface compatibility with the scheduler gateway pattern.
 * WB implementations always use the single page model — `modelId` is ignored by all adapters.
 */
export interface IWbSchedulerPublishExecuteParams {
    modelId: string;
    id: string;
    scheduleOn: Date;
}

export interface IWbSchedulerPublishGatewayResponse {
    item: WbSchedulerEntry;
}

export interface IWbSchedulerPublishGateway {
    execute(params: IWbSchedulerPublishExecuteParams): Promise<IWbSchedulerPublishGatewayResponse>;
}
