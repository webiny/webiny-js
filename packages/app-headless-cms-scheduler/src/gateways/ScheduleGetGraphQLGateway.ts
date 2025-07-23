import type { ScheduleEntry } from "~/types.js";

export interface IScheduleGetGraphQLQueryParams {
    modelId: string;
    id: string;
}

export interface IScheduleGetGraphQLGatewayResponse {
    item: ScheduleEntry;
}

export interface IScheduleGetGraphQLGateway {
    execute(params: IScheduleGetGraphQLQueryParams): Promise<IScheduleGetGraphQLGatewayResponse>;
}
