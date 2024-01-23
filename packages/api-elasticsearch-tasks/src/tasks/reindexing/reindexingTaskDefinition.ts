import { createTaskDefinition } from "@webiny/tasks";
import { Context, IElasticsearchIndexingTaskValues, IElasticsearchTaskConfig } from "~/types";

export const createElasticsearchReindexingTask = (params?: IElasticsearchTaskConfig) => {
    return createTaskDefinition<Context, IElasticsearchIndexingTaskValues>({
        id: "elasticsearchReindexing",
        title: "Elasticsearch reindexing",
        run: async ({ context, isCloseToTimeout, response, input, isAborted, store }) => {
            const { Manager } = await import(
                /* webpackChunkName: "ElasticsearchReindexingManager" */
                "../Manager"
            );
            const { IndexManager } = await import(
                /* webpackChunkName: "ElasticsearchReindexingSettings" */ "~/settings"
            );
            const { ReindexingTaskRunner } = await import(
                /* webpackChunkName: "ElasticsearchReindexingTaskRunner" */ "./ReindexingTaskRunner"
            );

            const manager = new Manager({
                elasticsearchClient: params?.elasticsearchClient,
                documentClient: params?.documentClient,
                response,
                context,
                isAborted,
                isCloseToTimeout,
                store
            });

            const indexManager = new IndexManager(manager.elasticsearch, input.settings || {});
            const reindexing = new ReindexingTaskRunner(manager, indexManager);

            const keys = input.keys || undefined;
            return reindexing.exec(keys, 200);
        }
    });
};
