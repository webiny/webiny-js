import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IElasticsearchIndexingTaskValues } from "~/types.js";
import { ReindexingTaskRunner } from "./abstractions/ReindexingTaskRunner.js";
import { IndexManagerFactory } from "~/settings/abstractions/IndexManagerFactory.js";

class ElasticsearchReindexingTaskImpl implements TaskDefinition.Interface<IElasticsearchIndexingTaskValues> {
    public readonly id = "elasticsearchReindexing";
    public readonly title = "Elasticsearch reindexing";

    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: ReindexingTaskRunner.Interface
    ) {}

    async run({ input, controller }: TaskDefinition.RunParams<IElasticsearchIndexingTaskValues>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: input.settings || {}
        });

        const keys = input.keys || undefined;
        return await this.runner.exec(keys, input.limit || 100, indexManager);
    }
}

export const ElasticsearchReindexingTask = TaskDefinition.createImplementation({
    implementation: ElasticsearchReindexingTaskImpl,
    dependencies: [IndexManagerFactory, ReindexingTaskRunner]
});
