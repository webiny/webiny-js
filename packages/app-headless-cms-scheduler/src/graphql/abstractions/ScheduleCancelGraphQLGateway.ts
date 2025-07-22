import type { ScheduleEntry } from "~/types.js";

export interface IScheduleCancelGraphQLMutationParams {
    id: string;
}

export interface IScheduleCancelGraphQLGateway {
    execute(params: IScheduleCancelGraphQLMutationParams): Promise<void>;
}
