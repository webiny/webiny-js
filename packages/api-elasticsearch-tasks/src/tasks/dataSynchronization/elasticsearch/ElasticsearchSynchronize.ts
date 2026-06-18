import { batchReadAll } from "@webiny/db-dynamodb/utils/batch/batchRead.js";
import { createSynchronizationBuilder } from "@webiny/api-dynamodb-to-elasticsearch";
import type { IGetElasticsearchEntityTypeParams } from "~/tasks/dataSynchronization/entities/index.js";
import {
    getElasticsearchEntity,
    getElasticsearchEntityType,
    getTable
} from "~/tasks/dataSynchronization/entities/index.js";
import type { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import type {
    IElasticsearchSynchronize,
    IElasticsearchSynchronizeExecuteParams,
    IElasticsearchSynchronizeExecuteResponse
} from "./abstractions/ElasticsearchSynchronize.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { DbRegistry } from "~/abstractions/DbRegistry.js";

interface IDynamoDbItem {
    PK: string;
    SK: string;
}

export class ElasticsearchSynchronize implements IElasticsearchSynchronize {
    public constructor(
        private readonly controller: TaskController.Interface,
        private readonly dbRegistry: DbRegistry.Interface,
        private readonly openSearchClient: OpenSearchClient.Interface
    ) {}

    public async execute(
        params: IElasticsearchSynchronizeExecuteParams
    ): Promise<IElasticsearchSynchronizeExecuteResponse> {
        const { items, done, index } = params;
        if (items.length === 0) {
            return {
                done: true
            };
        }

        const table = getTable({
            type: "es",
            dbRegistry: this.dbRegistry
        });

        const readableItems = items.map(item => {
            const entity = this.getEntity(item);
            return entity.item.entity.getBatch({
                PK: item.PK,
                SK: item.SK
            });
        });

        const tableItems = await batchReadAll<IDynamoDbItem>({
            items: readableItems,
            table
        });

        const elasticsearchSyncBuilder = createSynchronizationBuilder({
            context: { opensearch: this.openSearchClient.use() },
            timer: this.controller.runtime
        });
        /**
         * We need to find the items we have in the Elasticsearch but not in the DynamoDB-Elasticsearch table.
         */
        for (const item of items) {
            const exists = tableItems.some(ddbItem => {
                return ddbItem.PK === item.PK && ddbItem.SK === item.SK;
            });
            if (exists) {
                continue;
            }
            elasticsearchSyncBuilder.delete({
                index,
                id: item._id
            });
        }

        const executeWithRetry = elasticsearchSyncBuilder.build();
        await executeWithRetry();

        return {
            done
        };
    }

    private getEntity(
        params: IGetElasticsearchEntityTypeParams
    ): ReturnType<typeof getElasticsearchEntity> {
        const type = getElasticsearchEntityType(params);
        return getElasticsearchEntity({
            type,
            dbRegistry: this.dbRegistry
        });
    }
}
