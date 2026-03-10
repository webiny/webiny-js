import type { WbSchedulerEntry, SchedulerMetaResponse, ScheduleType } from "~/types.js";

export interface IWbSchedulerListExecuteParamsWhere {
    targetId?: string;
    title_contains?: string;
    title_not_contains?: string;
    type?: ScheduleType;
    scheduledBy?: string;
    scheduledFor?: Date;
    scheduledFor_gte?: Date;
    scheduledFor_lte?: Date;
}

export type IWbSchedulerListExecuteParamsSort = "scheduledFor_ASC" | "scheduledFor_DESC";

/**
 * Note: `modelId` is present for interface compatibility with the scheduler gateway pattern.
 * WB implementations always use the single page model — `modelId` is ignored by all adapters.
 */
export interface IWbSchedulerListExecuteParams {
    modelId: string;
    where?: IWbSchedulerListExecuteParamsWhere;
    sort?: IWbSchedulerListExecuteParamsSort[];
    limit?: number;
    after?: string;
}

export interface IWbSchedulerListGatewayResponse {
    items: WbSchedulerEntry[];
    meta: SchedulerMetaResponse;
}

export interface IWbSchedulerListGateway {
    execute(params: IWbSchedulerListExecuteParams): Promise<IWbSchedulerListGatewayResponse>;
}
