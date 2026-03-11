import type { SchedulerEntry } from "~/types.js";

export interface ISchedulePublishActionGatewayExecuteParams {
    app: string;
    id: string;
    scheduleOn: Date;
}

export interface ISchedulePublishActionGatewayExecuteResponse {
    item: SchedulerEntry;
}

export interface ISchedulePublishActionGateway {
    execute(
        params: ISchedulePublishActionGatewayExecuteParams
    ): Promise<ISchedulePublishActionGatewayExecuteResponse>;
}
