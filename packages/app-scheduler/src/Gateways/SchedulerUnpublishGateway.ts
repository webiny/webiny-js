import type { SchedulerEntry } from "~/types.js";

export interface ISchedulerUnpublishExecuteParams {
    app: string;
    id: string;
    scheduleOn: Date;
}

export interface ISchedulerUnpublishGatewayResponse {
    item: SchedulerEntry;
}

export interface ISchedulerUnpublishGateway {
    execute(params: ISchedulerUnpublishExecuteParams): Promise<ISchedulerUnpublishGatewayResponse>;
}
