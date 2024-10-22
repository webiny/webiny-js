import {
    Context,
    IDeleteOperationParams,
    IInsertOperationParams,
    IModifyOperationParams,
    IOperations
} from "~/types";
import { Operations } from "~/Operations";
import { executeWithRetry, IExecuteWithRetryParams } from "~/executeWithRetry";
import { ITimer } from "@webiny/handler-aws";

export type ISynchronizationBuilderExecuteWithRetryParams = Omit<
    IExecuteWithRetryParams,
    "context" | "timer" | "maxRunningTime" | "operations"
>;

export interface ISynchronizationBuilder {
    insert(params: IInsertOperationParams): void;
    delete(params: IDeleteOperationParams): void;
    executeWithRetry(params?: ISynchronizationBuilderExecuteWithRetryParams): Promise<void>;
}

export interface ISynchronizationBuilderParams {
    timer: ITimer;
    context: Context;
}

export class SynchronizationBuilder implements ISynchronizationBuilder {
    private readonly timer: ITimer;
    private readonly context: Context;
    private readonly operations: IOperations;

    public constructor(params: ISynchronizationBuilderParams) {
        this.timer = params.timer;
        this.context = params.context;
        this.operations = new Operations();
    }

    public insert(params: IInsertOperationParams): void {
        return this.operations.insert(params);
    }

    public modify(params: IModifyOperationParams): void {
        return this.operations.modify(params);
    }

    public delete(params: IDeleteOperationParams): void {
        return this.operations.delete(params);
    }

    public async executeWithRetry(
        params?: ISynchronizationBuilderExecuteWithRetryParams
    ): Promise<void> {
        await executeWithRetry({
            ...params,
            maxRunningTime: this.timer.getRemainingMilliseconds(),
            timer: this.timer,
            context: this.context,
            operations: this.operations
        });
        this.operations.clear();
    }
}

export const createSynchronizationBuilder = (
    params: ISynchronizationBuilderParams
): ISynchronizationBuilder => {
    return new SynchronizationBuilder(params);
};
