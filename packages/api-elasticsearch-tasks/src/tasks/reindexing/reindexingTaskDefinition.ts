import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IElasticsearchIndexingTaskValues } from "~/types.js";
import { Manager } from "~/types.js";
import { IndexManager } from "~/settings/index.js";
import { IndexSettingsManager } from "~/settings/IndexSettingsManager.js";
import { ReindexingTaskRunner } from "./ReindexingTaskRunner.js";

class ElasticsearchReindexingTaskImpl implements TaskDefinition.Interface<IElasticsearchIndexingTaskValues> {
    public readonly id = "elasticsearchReindexing";
    public readonly title = "Elasticsearch reindexing";

    constructor(
        private readonly manager: Manager.Interface,
        private readonly indexSettingsManager: IndexSettingsManager.Interface
    ) {}

    async run({ input, controller }: TaskDefinition.RunParams<IElasticsearchIndexingTaskValues>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = new IndexManager(
            this.manager.elasticsearch,
            this.indexSettingsManager,
            input.settings || {}
        );
        const reindexing = new ReindexingTaskRunner(this.manager, indexManager);

        const keys = input.keys || undefined;
        return await reindexing.exec(keys, input.limit || 100);
    }
}

export const ElasticsearchReindexingTask = TaskDefinition.createImplementation({
    implementation: ElasticsearchReindexingTaskImpl,
    dependencies: [Manager, IndexSettingsManager]
});
