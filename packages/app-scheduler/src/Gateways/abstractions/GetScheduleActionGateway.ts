import type { SchedulerEntry } from "~/types.js";

export interface IGetScheduleActionGatewayExecuteParams {
    app: string;
    id: string;
}

export type IGetScheduleActionGatewayResponse = SchedulerEntry | null;

export interface IGetScheduleActionGateway {
    execute(
        params: IGetScheduleActionGatewayExecuteParams
    ): Promise<IGetScheduleActionGatewayResponse>;
}
