import type { SchedulerEntry } from "~/types.js";

export interface ISchedulePublishActionExecuteParams {
    app: string;
    id: string;
    scheduleOn: Date;
}

export interface ISchedulePublishActionGatewayResponse {
    item: SchedulerEntry;
}

export interface ISchedulePublishActionGateway {
    execute(params: ISchedulePublishActionExecuteParams): Promise<ISchedulePublishActionGatewayResponse>;
}
