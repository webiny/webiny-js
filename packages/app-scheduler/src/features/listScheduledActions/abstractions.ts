import { createAbstraction } from "@webiny/feature/admin";
import type { SchedulerEntry, SchedulerMetaResponse, ScheduleActionType } from "~/types.js";

export interface IListScheduledActionsExecuteParamsWhere {
    targetId?: string;
    title_contains?: string;
    title_not_contains?: string;
    type?: ScheduleActionType;
    scheduledBy?: string;
    scheduledFor?: Date;
    scheduledFor_gte?: Date;
    scheduledFor_lte?: Date;
}

export type IListScheduledActionsExecuteParamsSort = "scheduledFor_ASC" | "scheduledFor_DESC";

export interface IListScheduledActionsGatewayExecuteParams {
    namespace: string;
    where?: IListScheduledActionsExecuteParamsWhere;
    sort?: IListScheduledActionsExecuteParamsSort[];
    limit?: number;
    after?: string;
}

export interface IListScheduledActionsGatewayExecuteResponse {
    items: SchedulerEntry[];
    meta: SchedulerMetaResponse;
}

export interface IListScheduledActionsGateway {
    execute(
        params: IListScheduledActionsGatewayExecuteParams
    ): Promise<IListScheduledActionsGatewayExecuteResponse>;
}

export const ListScheduledActionsGateway = createAbstraction<IListScheduledActionsGateway>(
    "Scheduler/ListScheduledActionsGateway"
);

export namespace ListScheduledActionsGateway {
    export type Interface = IListScheduledActionsGateway;
}
