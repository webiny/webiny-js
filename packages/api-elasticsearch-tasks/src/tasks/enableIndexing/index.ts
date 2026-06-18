import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IElasticsearchEnableIndexingTaskInput } from "./types.js";
import { Manager } from "../Manager.js";
import { IndexManager } from "~/settings/index.js";
import { EnableIndexingTaskRunner } from "./EnableIndexingTaskRunner.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { DynamoDBClient } from "@webiny/db-dynamodb";

class ElasticsearchEnableIndexingTaskImpl implements TaskDefinition.Interface<IElasticsearchEnableIndexingTaskInput> {
    id = "elasticsearchEnableIndexing";
    title = "Enable Indexing on Elasticsearch Indexes";

    constructor(
        private elasticsearchClient: OpenSearchClient.Interface,
        private documentClient: DynamoDBClient.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IElasticsearchEnableIndexingTaskInput>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const manager = new Manager<IElasticsearchEnableIndexingTaskInput>({
            elasticsearchClient: this.elasticsearchClient.use(),
            documentClient: this.documentClient.client,
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

export const ElasticsearchEnableIndexingTask = TaskDefinition.createImplementation({
    implementation: ElasticsearchEnableIndexingTaskImpl,
    dependencies: [OpenSearchClient, DynamoDBClient]
});
