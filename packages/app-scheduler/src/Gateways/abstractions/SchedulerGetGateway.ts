import type { SchedulerEntry } from "~/types.js";

export interface ISchedulerGetExecuteParams {
    app: string;
    id: string;
}

export type ISchedulerGetGatewayResponse = SchedulerEntry | null;

export interface ISchedulerGetGateway {
    execute(params: ISchedulerGetExecuteParams): Promise<ISchedulerGetGatewayResponse>;
}
