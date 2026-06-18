import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IElasticsearchEnableIndexingTaskInput } from "./types.js";
import { Manager } from "~/types.js";
import { IndexManager } from "~/settings/index.js";
import { IndexSettingsManager } from "~/settings/abstractions/IndexSettingsManager.js";
import { EnableIndexingTaskRunner } from "./EnableIndexingTaskRunner.js";

class ElasticsearchEnableIndexingTaskImpl implements TaskDefinition.Interface<IElasticsearchEnableIndexingTaskInput> {
    public readonly id = "elasticsearchEnableIndexing";
    public readonly title = "Enable Indexing on Elasticsearch Indexes";

    constructor(
        private readonly manager: Manager.Interface,
        private readonly indexSettingsManager: IndexSettingsManager.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IElasticsearchEnableIndexingTaskInput>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = new IndexManager(
            this.manager.elasticsearch,
            this.indexSettingsManager,
            {},
            {
                refreshInterval: input.refreshInterval,
                numberOfReplicas: input.numberOfReplicas
            }
        );

        const enableIndexing = new EnableIndexingTaskRunner(this.manager, indexManager);

        return enableIndexing.exec(input.matching);
    }
}

export const ElasticsearchEnableIndexingTask = TaskDefinition.createImplementation({
    implementation: ElasticsearchEnableIndexingTaskImpl,
    dependencies: [Manager, IndexSettingsManager]
});
