import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CreateIndexesRunner } from "./abstractions/CreateIndexesRunner.js";
import { OnBeforeTrigger } from "./abstractions/OnBeforeTrigger.js";
import { IndexManagerFactory } from "~/abstractions/IndexManagerFactory.js";

class CreateIndexesTaskImplHandlerImpl implements TaskHandler.Interface<CreateIndexesRunner.Input> {
    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: CreateIndexesRunner.Interface,
        private readonly onBeforeTriggerRunner: OnBeforeTrigger.Interface
    ) {}

    async run({ input, controller }: TaskHandler.RunParams<CreateIndexesRunner.Input>) {
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

const CreateIndexesTaskImplHandler = TaskHandler.createImplementation({
    implementation: CreateIndexesTaskImplHandlerImpl,
    dependencies: [IndexManagerFactory, CreateIndexesRunner, OnBeforeTrigger]
});

class CreateIndexesTaskImpl implements TaskDefinition.Interface {
    public readonly id = "elasticsearchCreateIndexes";
    public readonly title = "Create Missing Search Indexes";
    public readonly maxIterations = 2;

    handler = CreateIndexesTaskImplHandler;
}

export const CreateIndexesTask = TaskDefinition.createImplementation({
    implementation: CreateIndexesTaskImpl,
    dependencies: []
});
