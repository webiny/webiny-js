import type { CmsMetaResponse } from "@webiny/app-headless-cms-common/types/index.js";
import type { SchedulerEntry } from "~/types.js";
import { ScheduleType } from "~/types.js";

export interface ISchedulerListExecuteParamsWhere {
    targetId?: string;
    title_contains?: string;
    title_not_contains?: string;
    targetEntryId?: string;
    type?: ScheduleType;
    scheduledBy?: string;
    scheduledOn?: Date;
    scheduledOn_gte?: Date;
    scheduledOn_lte?: Date;
}

export type ISchedulerListExecuteParamsSort = "scheduledOn_ASC" | "scheduledOn_DESC";

export interface ISchedulerListExecuteParams {
    modelId: string;
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
