import type { SchedulerEntry } from "~/types.js";

export interface ISchedulerPublishExecuteParams {
    modelId: string;
    id: string;
    scheduleOn: Date;
}

export interface ISchedulerPublishGatewayResponse {
    item: SchedulerEntry;
}

export interface ISchedulerPublishGateway {
    execute(params: ISchedulerPublishExecuteParams): Promise<ISchedulerPublishGatewayResponse>;
}
