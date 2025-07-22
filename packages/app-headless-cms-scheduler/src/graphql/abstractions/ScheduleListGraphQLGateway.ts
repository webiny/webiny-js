import type { CmsMetaResponse } from "@webiny/app-headless-cms-common/types/index.js";
import type { ScheduleEntry } from "~/types.js";
import { ScheduleType } from "~/types.js";

export interface IScheduleListGraphQLQueryParamsWhere {
    targetId?: string;
    targetEntryId?: string;
    type?: ScheduleType;
    scheduledBy?: string;
    scheduledOn?: Date;
    scheduledOn_gte?: Date;
    scheduledOn_lte?: Date;
}

export type IScheduleListGraphQLQueryParamsSort = "scheduledOn_ASC" | "scheduledOn_DESC";

export interface IScheduleListGraphQLQueryParams {
    modelId: string;
    where?: IScheduleListGraphQLQueryParamsWhere;
    sort?: IScheduleListGraphQLQueryParamsSort[];
    limit?: number;
    after?: string;
}

export interface IScheduleListGraphQLGatewayResponse {
    items: ScheduleEntry[];
    meta: CmsMetaResponse;
}

export interface IScheduleListGraphQLGateway {
    execute(params: IScheduleListGraphQLQueryParams): Promise<IScheduleListGraphQLGatewayResponse>;
}
