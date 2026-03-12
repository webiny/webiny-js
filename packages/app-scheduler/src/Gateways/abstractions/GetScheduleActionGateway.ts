import type { SchedulerEntry } from "~/types.js";

export interface IGetScheduleActionGatewayExecuteParams {
    namespace: string;
    id: string;
}

export type IGetScheduleActionGatewayResponse = SchedulerEntry | null;

export interface IGetScheduleActionGateway {
    execute(
        params: IGetScheduleActionGatewayExecuteParams
    ): Promise<IGetScheduleActionGatewayResponse>;
}
