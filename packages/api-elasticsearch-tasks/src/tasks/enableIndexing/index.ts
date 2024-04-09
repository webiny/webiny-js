import { createTaskDefinition } from "@webiny/tasks";
import { Context, IElasticsearchTaskConfig } from "~/types";
import { IElasticsearchEnableIndexingTaskInput } from "./types";

export const createEnableIndexingTask = (params?: IElasticsearchTaskConfig) => {
    return createTaskDefinition<Context, IElasticsearchEnableIndexingTaskInput>({
        id: "elasticsearchEnableIndexing",
        title: "Enable Indexing on Elasticsearch Indexes",
        run: async ({ response, context, isAborted, isCloseToTimeout, input, store }) => {
            const { Manager } = await import(
                /* webpackChunkName: "ElasticsearchTaskManager" */
                "../Manager"
            );
            const { IndexManager } = await import(
                /* webpackChunkName: "ElasticsearchTaskSettings" */ "~/settings"
            );

            const { EnableIndexingTaskRunner } = await import(
                /* webpackChunkName: "ElasticsearchEnableIndexingTaskRunner" */ "./EnableIndexingTaskRunner"
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

            const indexManager = new IndexManager(
                manager.elasticsearch,
                {},
                {
                    refreshInterval: input.refreshInterval,
                    numberOfReplicas: input.numberOfReplicas
                }
            );

            const enableIndexing = new EnableIndexingTaskRunner(manager, indexManager);

            return enableIndexing.exec(input.matching);
        }
    });
};
