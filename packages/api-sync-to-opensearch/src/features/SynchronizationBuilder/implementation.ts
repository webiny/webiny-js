import {
    OperationsFactory,
    type IInsertOperationParams,
    type IModifyOperationParams,
    type IDeleteOperationParams,
    type Operations
} from "../Operations/abstraction.js";
import { Timer } from "@webiny/utils/features/Timer/abstraction.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import {
    ExecuteSyncWithRetry,
    type IExecuteSyncWithRetryParams
} from "../ExecuteSyncWithRetry/abstraction.js";
import type { ISynchronizationBuilder } from "./abstraction.js";
import { SynchronizationBuilder } from "./abstraction.js";

class SynchronizationBuilderImpl implements ISynchronizationBuilder {
    private readonly operations: Operations.Interface;

    public constructor(
        private readonly timer: Timer.Interface,
        private readonly openSearchClient: OpenSearchClient.Interface,
        private readonly executeSyncWithRetry: ExecuteSyncWithRetry.Interface,
        operationsFactory: OperationsFactory.Interface
    ) {
        this.operations = operationsFactory.create();
    }

    public insert(params: IInsertOperationParams): void {
        this.operations.insert(params);
    }

    public modify(params: IModifyOperationParams): void {
        this.operations.modify(params);
    }

    public delete(params: IDeleteOperationParams): void {
        this.operations.delete(params);
    }

    public build() {
        return async (params?: Partial<IExecuteSyncWithRetryParams>) => {
            if (this.operations.total === 0) {
                return;
            }
            await this.executeSyncWithRetry.execute({
                ...params,
                maxRunningTime: this.timer.getRemainingSeconds(),
                timer: this.timer,
                openSearchClient: this.openSearchClient.use(),
                operations: this.operations
            });
            this.operations.clear();
        };
    }
}

export const SynchronizationBuilderImplementation = SynchronizationBuilder.createImplementation({
    implementation: SynchronizationBuilderImpl,
    dependencies: [Timer, OpenSearchClient, ExecuteSyncWithRetry, OperationsFactory]
});
