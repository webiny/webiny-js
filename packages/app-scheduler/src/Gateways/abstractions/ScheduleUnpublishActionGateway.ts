import type { SchedulerEntry } from "~/types.js";

export interface IScheduleUnpublishActionGatewayExecuteParams {
    app: string;
    id: string;
    scheduleOn: Date;
}

export interface IScheduleUnpublishActionGatewayExecuteResponse {
    item: SchedulerEntry;
}

export interface IScheduleUnpublishActionGateway {
    execute(
        params: IScheduleUnpublishActionGatewayExecuteParams
    ): Promise<IScheduleUnpublishActionGatewayExecuteResponse>;
}
