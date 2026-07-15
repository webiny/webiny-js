import { Operations } from "../Operations/abstractions/Operations.js";
import { OperationsFactory } from "../Operations/abstractions/OperationsFactory.js";
import { Timer } from "@webiny/utils/features/Timer/abstraction.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { ExecuteSyncWithRetry } from "../ExecuteSyncWithRetry/abstraction.js";
import { SynchronizationBuilder as SynchronizationBuilderAbstraction } from "./abstraction.js";

class SynchronizationBuilderImpl implements SynchronizationBuilderAbstraction.Interface {
    private readonly operations: Operations.Interface;

    public constructor(
        private readonly timer: Timer.Interface,
        private readonly openSearchClient: OpenSearchClient.Interface,
        private readonly executeSyncWithRetry: ExecuteSyncWithRetry.Interface,
        operationsFactory: OperationsFactory.Interface
    ) {
        this.operations = operationsFactory.create();
    }

    public insert(params: Operations.InsertParams): void {
        this.operations.insert(params);
    }

    public modify(params: Operations.ModifyParams): void {
        this.operations.modify(params);
    }

    public delete(params: Operations.DeleteParams): void {
        this.operations.delete(params);
    }

    public build() {
        return async (params?: Partial<ExecuteSyncWithRetry.Params>) => {
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

export const SynchronizationBuilder = SynchronizationBuilderAbstraction.createImplementation({
    implementation: SynchronizationBuilderImpl,
    dependencies: [Timer, OpenSearchClient, ExecuteSyncWithRetry, OperationsFactory]
});
