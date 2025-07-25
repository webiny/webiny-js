import type { SchedulerEntry } from "~/types.js";

export interface ISchedulerGetExecuteParams {
    modelId: string;
    id: string;
}

export interface ISchedulerGetGatewayResponse {
    item: SchedulerEntry;
}

export interface ISchedulerGetGateway {
    execute(params: ISchedulerGetExecuteParams): Promise<ISchedulerGetGatewayResponse>;
}
