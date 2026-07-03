import { createAbstraction } from "@webiny/feature/admin";
import type { SchedulerEntry } from "~/types.js";

export interface IScheduleUnpublishActionGatewayExecuteParams {
    namespace: string;
    targetId: string;
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

export const ScheduleUnpublishActionGateway = createAbstraction<IScheduleUnpublishActionGateway>(
    "Scheduler/ScheduleUnpublishActionGateway"
);

export namespace ScheduleUnpublishActionGateway {
    export type Interface = IScheduleUnpublishActionGateway;
}
