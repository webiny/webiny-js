import type { SchedulerEntry, SchedulerMetaResponse } from "~/types.js";
import type { ScheduleActionType } from "~/types.js";

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
