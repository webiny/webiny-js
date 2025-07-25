export interface IScheduleCancelExecuteParams {
    modelId: string;
    id: string;
}

export interface ISchedulerCancelGateway {
    execute(params: IScheduleCancelExecuteParams): Promise<void>;
}
