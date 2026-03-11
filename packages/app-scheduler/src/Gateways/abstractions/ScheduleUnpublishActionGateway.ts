import type { SchedulerEntry } from "~/types.js";

export interface IScheduleUnpublishActionExecuteParams {
    app: string;
    id: string;
    scheduleOn: Date;
}

export interface IScheduleUnpublishActionGatewayResponse {
    item: SchedulerEntry;
}

export interface IScheduleUnpublishActionGateway {
    execute(params: IScheduleUnpublishActionExecuteParams): Promise<IScheduleUnpublishActionGatewayResponse>;
}
