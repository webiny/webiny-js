import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IElasticsearchIndexingTaskValues } from "~/types.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { DynamoDBClient } from "@webiny/db-dynamodb/exports/api/db.js";

class ElasticsearchReindexingTaskImpl implements TaskDefinition.Interface<IElasticsearchIndexingTaskValues> {
    id = "elasticsearchReindexing";
    title = "Elasticsearch reindexing";

    constructor(
        private readonly elasticsearchClient: OpenSearchClient.Interface,
        private readonly documentClient: DynamoDBClient.Interface
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
            elasticsearchClient: this.elasticsearchClient.use(),
            documentClient: this.documentClient.client,
            controller
        });

        const indexManager = new IndexManager(manager.elasticsearch, input.settings || {});
        const reindexing = new ReindexingTaskRunner(manager, indexManager);

        const keys = input.keys || undefined;
        return await reindexing.exec(keys, input.limit || 100);
    }
}

export const ElasticsearchReindexingTask = TaskDefinition.createImplementation({
    implementation: ElasticsearchReindexingTaskImpl,
    dependencies: [OpenSearchClient, DynamoDBClient]
});
