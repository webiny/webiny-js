import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IElasticsearchIndexingTaskValues, IElasticsearchTaskConfig } from "~/types.js";
import { createContextPlugin } from "@webiny/api";

class ElasticsearchReindexingTask
    implements TaskDefinition.Interface<IElasticsearchIndexingTaskValues>
{
    id = "elasticsearchReindexing";
    title = "Elasticsearch reindexing";

    constructor(private config: IElasticsearchTaskConfig | undefined) {}

    async run({ input, controller }: TaskDefinition.RunParams<IElasticsearchIndexingTaskValues>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const { Manager } = await import(
            /* webpackChunkName: "Manager" */
            "../Manager.js"
        );
        const { IndexManager } = await import(
            /* webpackChunkName: "IndexManager" */ "~/settings/index.js"
        );
        const { ReindexingTaskRunner } = await import(
            /* webpackChunkName: "ReindexingTaskRunner" */ "./ReindexingTaskRunner.js"
        );

        const manager = new Manager<IElasticsearchIndexingTaskValues>({
            elasticsearchClient: this.config?.elasticsearchClient,
            documentClient: this.config?.documentClient,
            controller
        });

        const indexManager = new IndexManager(manager.elasticsearch, input.settings || {});
        const reindexing = new ReindexingTaskRunner(manager, indexManager);

        const keys = input.keys || undefined;
        return await reindexing.exec(keys, input.limit || 100);
    }
}

export const createElasticsearchReindexingTask = (params?: IElasticsearchTaskConfig) => {
    return createContextPlugin(context => {
        context.container.registerFactory(
            TaskDefinition,
            () => new ElasticsearchReindexingTask(params)
        );
    });
};
