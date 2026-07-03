import type {
    IDeleteOperationParams,
    IInsertOperationParams,
    IModifyOperationParams
} from "~/types.js";
import { Operations } from "~/Operations.js";
import type { IExecuteWithRetryParams } from "~/executeWithRetry.js";
import { executeWithRetry } from "~/executeWithRetry.js";
import type { ITimer } from "@webiny/handler-aws";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";

export type ISynchronizationBuilderExecuteWithRetryParams = Omit<
    IExecuteWithRetryParams,
    "opensearch" | "timer" | "maxRunningTime" | "operations"
>;

export interface ISynchronizationBuilder {
    insert(params: IInsertOperationParams): void;
    delete(params: IDeleteOperationParams): void;
    build: () => (params?: ISynchronizationBuilderExecuteWithRetryParams) => Promise<void>;
}

export interface ISynchronizationBuilderParams {
    timer: ITimer;
    openSearchClient: OpenSearchClient.Client;
}

export class SynchronizationBuilder implements ISynchronizationBuilder {
    private readonly timer;
    private readonly openSearchClient;
    private readonly operations;

    public constructor(params: ISynchronizationBuilderParams) {
        this.timer = params.timer;
        this.openSearchClient = params.openSearchClient;
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

    public build() {
        return async (params?: ISynchronizationBuilderExecuteWithRetryParams) => {
            if (this.operations.total === 0) {
                return;
            }
            await executeWithRetry({
                ...params,
                maxRunningTime: this.timer.getRemainingMilliseconds(),
                timer: this.timer,
                openSearchClient: this.openSearchClient,
                operations: this.operations
            });
            this.operations.clear();
        };
    }
}

export const createSynchronizationBuilder = (
    params: ISynchronizationBuilderParams
): ISynchronizationBuilder => {
    return new SynchronizationBuilder(params);
};
