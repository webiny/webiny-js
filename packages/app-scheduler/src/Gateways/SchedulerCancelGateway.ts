export interface IScheduleCancelExecuteParams {
    app: string;
    id: string;
}

export interface ISchedulerCancelGateway {
    execute(params: IScheduleCancelExecuteParams): Promise<void>;
}
