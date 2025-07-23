import type { ScheduleEntry } from "~/types.js";

export interface IScheduleUnpublishGraphQLMutationParams {
    modelId: string;
    id: string;
    scheduleOn: Date;
}

export interface IScheduleUnpublishGraphQLGatewayResponse {
    item: ScheduleEntry | null;
}

export interface IScheduleUnpublishGraphQLGateway {
    execute(
        params: IScheduleUnpublishGraphQLMutationParams
    ): Promise<IScheduleUnpublishGraphQLGatewayResponse>;
}
