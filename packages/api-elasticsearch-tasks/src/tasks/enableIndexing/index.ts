import { createContextPlugin } from "@webiny/api";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { Context, IElasticsearchTaskConfig } from "~/types.js";
import type { IElasticsearchEnableIndexingTaskInput } from "./types.js";
import { Manager } from "../Manager.js";
import { IndexManager } from "~/settings/index.js";
import { EnableIndexingTaskRunner } from "./EnableIndexingTaskRunner.js";
import { getClients } from "~/helpers/getClients.js";

class ElasticsearchEnableIndexingTask implements TaskDefinition.Interface<IElasticsearchEnableIndexingTaskInput> {
    id = "elasticsearchEnableIndexing";
    title = "Enable Indexing on Elasticsearch Indexes";

    constructor(
        private elasticsearchClient: IElasticsearchTaskConfig["elasticsearchClient"],
        private documentClient: IElasticsearchTaskConfig["documentClient"]
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IElasticsearchEnableIndexingTaskInput>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const manager = new Manager<IElasticsearchEnableIndexingTaskInput>({
            elasticsearchClient: this.elasticsearchClient,
            documentClient: this.documentClient,
            controller
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
}

export const createEnableIndexingTask = (params?: Partial<IElasticsearchTaskConfig>) => {
    return createContextPlugin<Context>(context => {
        const clients = getClients(context, params);

        // Register the task definition
        context.container.registerFactory(TaskDefinition, () => {
            return new ElasticsearchEnableIndexingTask(
                clients.elasticsearchClient,
                clients.documentClient
            );
        });
    });
};
