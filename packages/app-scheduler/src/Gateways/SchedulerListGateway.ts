import type { CmsMetaResponse } from "@webiny/app-headless-cms-common/types/index.js";
import type { SchedulerEntry } from "~/types.js";
import type { ScheduleType } from "~/types.js";

export interface ISchedulerListExecuteParamsWhere {
    targetId?: string;
    title_contains?: string;
    title_not_contains?: string;
    type?: ScheduleType;
    scheduledBy?: string;
    scheduledFor?: Date;
    scheduledFor_gte?: Date;
    scheduledFor_lte?: Date;
}

export type ISchedulerListExecuteParamsSort = "scheduledFor_ASC" | "scheduledFor_DESC";

export interface ISchedulerListExecuteParams {
    app: string;
    where?: ISchedulerListExecuteParamsWhere;
    sort?: ISchedulerListExecuteParamsSort[];
    limit?: number;
    after?: string;
}

export interface ISchedulerListGatewayResponse {
    items: SchedulerEntry[];
    meta: CmsMetaResponse;
}

export interface ISchedulerListGateway {
    execute(params: ISchedulerListExecuteParams): Promise<ISchedulerListGatewayResponse>;
}
