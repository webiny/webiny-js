import { createTaskDefinition } from "@webiny/tasks";
import { Context, IElasticsearchTaskConfig } from "~/types";
import { IElasticsearchCreateIndexesTaskInput } from "~/tasks/createIndexes/types";
import { CreateIndexesTaskRunner } from "./CreateIndexesTaskRunner";

export const createIndexesTask = (params?: IElasticsearchTaskConfig) => {
    return createTaskDefinition<Context, IElasticsearchCreateIndexesTaskInput>({
        id: "elasticsearchCreateIndexes",
        title: "Create Missing Elasticsearch Indexes",
        maxIterations: 1,
        run: async ({ response, context, isCloseToTimeout, isAborted, store, input }) => {
            const { Manager } = await import(
                /* webpackChunkName: "ElasticsearchTaskManager" */
                "../Manager"
            );
            const { IndexManager } = await import(
                /* webpackChunkName: "ElasticsearchTaskSettings" */ "~/settings"
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

            const indexManager = new IndexManager(manager.elasticsearch, {});

            const createIndexesTaskRunner = new CreateIndexesTaskRunner(manager, indexManager);

            return createIndexesTaskRunner.execute(input.matching, Array.from(input.done || []));
        }
    });
};
