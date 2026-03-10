/**
 * Note: `modelId` is present for interface compatibility with the scheduler gateway pattern.
 * WB implementations always use the single page model — `modelId` is ignored by all adapters.
 */
export interface IWbSchedulerCancelExecuteParams {
    modelId: string;
    id: string;
}

export interface IWbSchedulerCancelGateway {
    execute(params: IWbSchedulerCancelExecuteParams): Promise<void>;
}
