import type { SchedulerEntry } from "~/types.js";

export interface ISchedulerGetExecuteParams {
    modelId: string;
    id: string;
}

export type ISchedulerGetGatewayResponse = SchedulerEntry | null;

export interface ISchedulerGetGateway {
    execute(params: ISchedulerGetExecuteParams): Promise<ISchedulerGetGatewayResponse>;
}
