import type { CmsMetaResponse } from "@webiny/app-headless-cms-common/types/index.js";
import type { SchedulerEntry } from "~/types.js";
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

export interface IListScheduleActionsExecuteParams {
    app: string;
    where?: IListScheduleActionsExecuteParamsWhere;
    sort?: IListScheduleActionsExecuteParamsSort[];
    limit?: number;
    after?: string;
}

export interface IListScheduleActionsGatewayResponse {
    items: SchedulerEntry[];
    meta: CmsMetaResponse;
}

export interface IListScheduleActionsGateway {
    execute(params: IListScheduleActionsExecuteParams): Promise<IListScheduleActionsGatewayResponse>;
}
