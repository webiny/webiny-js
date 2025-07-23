export interface IScheduleCancelGraphQLMutationParams {
    id: string;
}

export interface IScheduleCancelGraphQLGateway {
    execute(params: IScheduleCancelGraphQLMutationParams): Promise<void>;
}
