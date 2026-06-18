import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IElasticsearchCreateIndexesTaskInput } from "~/tasks/createIndexes/types.js";
import { Manager } from "~/types.js";
import { IndexManager } from "~/settings/index.js";
import { DisableIndexing } from "~/settings/abstractions/DisableIndexing.js";
import { EnableIndexing } from "~/settings/abstractions/EnableIndexing.js";
import { CreateIndexesTaskRunner } from "./abstractions/CreateIndexesTaskRunner.js";
import { OnBeforeTrigger } from "./abstractions/OnBeforeTrigger.js";

class CreateIndexesTaskImpl implements TaskDefinition.Interface<IElasticsearchCreateIndexesTaskInput> {
    public readonly id = "elasticsearchCreateIndexes";
    public readonly title = "Create Missing Elasticsearch Indexes";
    public readonly maxIterations = 2;

    constructor(
        private readonly manager: Manager.Interface,
        private readonly disableIndexing: DisableIndexing.Interface,
        private readonly enableIndexing: EnableIndexing.Interface,
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

        const indexManager = new IndexManager(
            this.manager.elasticsearch,
            this.disableIndexing,
            this.enableIndexing,
            {}
        );

        return this.runner.execute(input.matching, Array.from(input.done || []), indexManager);
    }

    async onBeforeTrigger() {
        const indexManager = new IndexManager(
            this.manager.elasticsearch,
            this.disableIndexing,
            this.enableIndexing,
            {}
        );

        await this.onBeforeTriggerRunner.run(["wbytask"], indexManager);
    }
}

export const CreateIndexesTask = TaskDefinition.createImplementation({
    implementation: CreateIndexesTaskImpl,
    dependencies: [
        Manager,
        DisableIndexing,
        EnableIndexing,
        CreateIndexesTaskRunner,
        OnBeforeTrigger
    ]
});
