import type { SchedulerEntry, SchedulerMetaResponse } from "~/types.js";
import type { ScheduleType } from "~/types.js";

export interface IListScheduleActionsExecuteParamsWhere {
    targetId?: string;
    title_contains?: string;
    title_not_contains?: string;
    type?: ScheduleType;
    scheduledBy?: string;
    scheduledFor?: Date;
    scheduledFor_gte?: Date;
    scheduledFor_lte?: Date;
}

export type IListScheduleActionsExecuteParamsSort = "scheduledFor_ASC" | "scheduledFor_DESC";

export interface IListScheduleActionsGatewayExecuteParams {
    app: string;
    where?: IListScheduleActionsExecuteParamsWhere;
    sort?: IListScheduleActionsExecuteParamsSort[];
    limit?: number;
    after?: string;
}

export interface IListScheduleActionsGatewayExecuteResponse {
    items: SchedulerEntry[];
    meta: SchedulerMetaResponse;
}

export interface IListScheduleActionsGateway {
    execute(
        params: IListScheduleActionsGatewayExecuteParams
    ): Promise<IListScheduleActionsGatewayExecuteResponse>;
}
