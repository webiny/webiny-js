import { createAbstraction } from "@webiny/feature/admin";
import type { SchedulerEntry } from "~/types.js";

export interface ISchedulePublishActionGatewayExecuteParams {
    namespace: string;
    targetId: string;
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

export const SchedulePublishActionGateway = createAbstraction<ISchedulePublishActionGateway>(
    "Scheduler/SchedulePublishActionGateway"
);

export namespace SchedulePublishActionGateway {
    export type Interface = ISchedulePublishActionGateway;
}
