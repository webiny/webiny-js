import type { WbSchedulerEntry } from "~/types.js";

/**
 * Note: `modelId` is present for interface compatibility with the scheduler gateway pattern.
 * WB implementations always use the single page model — `modelId` is ignored by all adapters.
 */
export interface IWbSchedulerUnpublishExecuteParams {
    modelId: string;
    id: string;
    scheduleOn: Date;
}

export interface IWbSchedulerUnpublishGatewayResponse {
    item: WbSchedulerEntry;
}

export interface IWbSchedulerUnpublishGateway {
    execute(
        params: IWbSchedulerUnpublishExecuteParams
    ): Promise<IWbSchedulerUnpublishGatewayResponse>;
}
