import { createContextPlugin } from "@webiny/api";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type {
    Context,
    IElasticsearchIndexingTaskValues,
    IElasticsearchTaskConfig
} from "~/types.js";
import { getClients } from "~/helpers/getClients.js";

class ElasticsearchReindexingTask implements TaskDefinition.Interface<IElasticsearchIndexingTaskValues> {
    id = "elasticsearchReindexing";
    title = "Elasticsearch reindexing";

    constructor(
        private elasticsearchClient: IElasticsearchTaskConfig["elasticsearchClient"],
        private documentClient: IElasticsearchTaskConfig["documentClient"]
    ) {}

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
            elasticsearchClient: this.elasticsearchClient,
            documentClient: this.documentClient,
            controller
        });

        const indexManager = new IndexManager(manager.elasticsearch, input.settings || {});
        const reindexing = new ReindexingTaskRunner(manager, indexManager);

        const keys = input.keys || undefined;
        return await reindexing.exec(keys, input.limit || 100);
    }
}

export const createElasticsearchReindexingTask = (params?: Partial<IElasticsearchTaskConfig>) => {
    return createContextPlugin<Context>(context => {
        const { documentClient, elasticsearchClient } = getClients(context, params);

        context.container.registerFactory(
            TaskDefinition,
            () => new ElasticsearchReindexingTask(elasticsearchClient, documentClient)
        );
    });
};
