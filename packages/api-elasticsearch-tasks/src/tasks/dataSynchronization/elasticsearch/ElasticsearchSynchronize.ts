import { batchReadAll } from "@webiny/db-dynamodb";
import { createSynchronizationBuilder } from "@webiny/api-dynamodb-to-elasticsearch";
import type { IGetElasticsearchEntityTypeParams } from "~/tasks/dataSynchronization/entities/index.js";
import {
    getElasticsearchEntity,
    getElasticsearchEntityType,
    getTable
} from "~/tasks/dataSynchronization/entities/index.js";
import type { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import type { IDbRegistry } from "~/abstractions/index.js";
import type {
    IElasticsearchSynchronize,
    IElasticsearchSynchronizeExecuteParams,
    IElasticsearchSynchronizeExecuteResponse
} from "./abstractions/ElasticsearchSynchronize.js";
import { SynchronizationContext } from "~/abstractions/SynchronizationContext.js";

export interface IElasticsearchSynchronizeParams {
    controller: TaskController.Interface;
    context: SynchronizationContext.Interface;
    dbRegistry: IDbRegistry;
}

interface IDynamoDbItem {
    PK: string;
    SK: string;
}

export class ElasticsearchSynchronize implements IElasticsearchSynchronize {
    private readonly controller: TaskController.Interface;
    private readonly dbRegistry: IDbRegistry;
    private context: SynchronizationContext.Interface;

    public constructor(params: IElasticsearchSynchronizeParams) {
        this.controller = params.controller;
        this.context = params.context;
        this.dbRegistry = params.dbRegistry;
    }

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
            return entity.item.getBatch({
                PK: item.PK,
                SK: item.SK
            });
        });

        const tableItems = await batchReadAll<IDynamoDbItem>({
            items: readableItems,
            table
        });

        const elasticsearchSyncBuilder = createSynchronizationBuilder({
            context: this.context,
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
