import { createTaskDefinition } from "@webiny/tasks";
import { Context, IElasticsearchIndexingTaskValues } from "~/types";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { Client } from "@webiny/api-elasticsearch";

export interface CreateElasticsearchIndexTaskConfig {
    documentClient?: DynamoDBDocument;
    elasticsearchClient?: Client;
}

export const createElasticsearchReindexingTask = (params?: CreateElasticsearchIndexTaskConfig) => {
    return createTaskDefinition<Context, IElasticsearchIndexingTaskValues>({
        id: "elasticsearchReindexing",
        title: "Elasticsearch reindexing",
        run: async ({ context, isCloseToTimeout, response, input, isAborted, store }) => {
            const { Manager } = await import("../Manager");
            const { IndexManager } = await import("~/settings");
            const { ReindexingTaskRunner } = await import("./ReindexingTaskRunner");

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
