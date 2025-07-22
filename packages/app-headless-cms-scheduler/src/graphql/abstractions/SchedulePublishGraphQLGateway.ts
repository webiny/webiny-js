import type { ScheduleEntry } from "~/types.js";

export interface ISchedulePublishGraphQLMutationParams {
    modelId: string;
    id: string;
    scheduleOn: Date;
}

export interface ISchedulePublishGraphQLGatewayResponse {
    item: ScheduleEntry | null;
}

export interface ISchedulePublishGraphQLGateway {
    execute(
        params: ISchedulePublishGraphQLMutationParams
    ): Promise<ISchedulePublishGraphQLGatewayResponse>;
}
