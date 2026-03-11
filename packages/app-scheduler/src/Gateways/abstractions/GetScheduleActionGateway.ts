import type { SchedulerEntry } from "~/types.js";

export interface IGetScheduleActionExecuteParams {
    app: string;
    id: string;
}

export type IGetScheduleActionGatewayResponse = SchedulerEntry | null;

export interface IGetScheduleActionGateway {
    execute(params: IGetScheduleActionExecuteParams): Promise<IGetScheduleActionGatewayResponse>;
}
