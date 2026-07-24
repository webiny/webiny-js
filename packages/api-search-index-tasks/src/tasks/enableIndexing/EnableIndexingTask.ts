import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { EnableIndexingRunner } from "./abstractions/EnableIndexingRunner.js";
import { IndexManagerFactory } from "~/abstractions/IndexManagerFactory.js";

class EnableIndexingTaskImpl implements TaskDefinition.Interface<EnableIndexingRunner.Input> {
    public readonly id = "elasticsearchEnableIndexing";
    public readonly title = "Enable Search Indexing";
    public readonly maxIterations = 2;

    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: EnableIndexingRunner.Interface
    ) {}

    async run({ input, controller }: TaskDefinition.RunParams<EnableIndexingRunner.Input>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: {},
            defaults: {
                refreshInterval: input.refreshInterval,
                numberOfReplicas: input.numberOfReplicas
            }
        });

        return this.runner.exec(input.matching, indexManager);
    }
}

export const EnableIndexingTask = TaskDefinition.createImplementation({
    implementation: EnableIndexingTaskImpl,
    dependencies: [IndexManagerFactory, EnableIndexingRunner]
});
