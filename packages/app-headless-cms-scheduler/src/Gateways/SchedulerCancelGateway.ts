export interface IScheduleCancelExecuteParams {
    id: string;
}

export interface ISchedulerCancelGateway {
    execute(params: IScheduleCancelExecuteParams): Promise<void>;
}
