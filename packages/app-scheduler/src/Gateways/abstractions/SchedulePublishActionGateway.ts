import type { SchedulerEntry } from "~/types.js";

export interface ISchedulePublishActionGatewayExecuteParams {
    namespace: string;
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
