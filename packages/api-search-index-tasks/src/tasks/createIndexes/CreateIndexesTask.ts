import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CreateIndexesRunner } from "./abstractions/CreateIndexesRunner.js";
import { OnBeforeTrigger } from "./abstractions/OnBeforeTrigger.js";
import { IndexManagerFactory } from "~/abstractions/IndexManagerFactory.js";

class CreateIndexesTaskImpl implements TaskDefinition.Interface<CreateIndexesRunner.Input> {
    public readonly id = "elasticsearchCreateIndexes";
    public readonly title = "Create Missing Search Indexes";
    public readonly maxIterations = 2;

    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: CreateIndexesRunner.Interface,
        private readonly onBeforeTriggerRunner: OnBeforeTrigger.Interface
    ) {}

    async run({ input, controller }: TaskDefinition.RunParams<CreateIndexesRunner.Input>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: {}
        });

        return this.runner.execute(input.matching, Array.from(input.done || []), indexManager);
    }

    async onBeforeTrigger() {
        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: {}
        });

        await this.onBeforeTriggerRunner.run(["wbytask"], indexManager);
    }
}

export const CreateIndexesTask = TaskDefinition.createImplementation({
    implementation: CreateIndexesTaskImpl,
    dependencies: [IndexManagerFactory, CreateIndexesRunner, OnBeforeTrigger]
});
