import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IElasticsearchCreateIndexesTaskInput } from "~/tasks/createIndexes/types.js";
import { CreateIndexesTaskRunner } from "./abstractions/CreateIndexesTaskRunner.js";
import { OnBeforeTrigger } from "./abstractions/OnBeforeTrigger.js";
import { IndexManagerFactory } from "~/settings/abstractions/IndexManagerFactory.js";

class CreateIndexesTaskImpl implements TaskDefinition.Interface<IElasticsearchCreateIndexesTaskInput> {
    public readonly id = "elasticsearchCreateIndexes";
    public readonly title = "Create Missing Elasticsearch Indexes";
    public readonly maxIterations = 2;

    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: CreateIndexesTaskRunner.Interface,
        private readonly onBeforeTriggerRunner: OnBeforeTrigger.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IElasticsearchCreateIndexesTaskInput>) {
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
    dependencies: [IndexManagerFactory, CreateIndexesTaskRunner, OnBeforeTrigger]
});
