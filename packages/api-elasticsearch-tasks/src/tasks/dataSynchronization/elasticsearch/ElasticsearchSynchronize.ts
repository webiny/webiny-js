import { batchReadAll } from "@webiny/db-dynamodb";
import { createSynchronizationBuilder } from "@webiny/api-dynamodb-to-elasticsearch";
import {
    getElasticsearchEntity,
    getElasticsearchEntityType
} from "~/tasks/dataSynchronization/entities";
import { ITimer } from "@webiny/handler-aws";
import { Context } from "~/types";
import {
    IElasticsearchSynchronize,
    IElasticsearchSynchronizeExecuteParams,
    IElasticsearchSynchronizeExecuteResponse
} from "./abstractions/ElasticsearchSynchronize";

export interface IElasticsearchSynchronizeParams {
    timer: ITimer;
    context: Context;
}

export class ElasticsearchSynchronize implements IElasticsearchSynchronize {
    private readonly timer: ITimer;
    private readonly context: Context;

    public constructor(params: IElasticsearchSynchronizeParams) {
        this.timer = params.timer;
        this.context = params.context;
    }

    public async execute(
        params: IElasticsearchSynchronizeExecuteParams
    ): Promise<IElasticsearchSynchronizeExecuteResponse> {
        const { items, cursor, done, totalCount, index } = params;
        if (items.length === 0 || totalCount === 0) {
            return {
                done: true,
                cursor: undefined,
                totalCount
            };
        }

        const entity = this.getEntity(index);

        const dynamoDbItems = await batchReadAll({
            items: items.map(item => {
                return entity.getBatch({
                    PK: item.PK,
                    SK: item.SK
                });
            }),
            table: entity.table
        });

        const elasticsearchSync = createSynchronizationBuilder({
            timer: this.timer,
            context: this.context
        });
        /**
         * We need to find the items we have in the Elasticsearch but not in the DynamoDB-Elasticsearch table.
         */
        for (const item of items) {
            const exists = dynamoDbItems.some(ddbItem => {
                return ddbItem.PK === item.PK && ddbItem.SK === item.SK;
            });
            if (exists) {
                continue;
            }
            elasticsearchSync.delete({
                index,
                id: `${item.PK}:${item.SK}`
            });
        }
        await elasticsearchSync.executeWithRetry();

        return {
            done,
            totalCount,
            cursor
        };
    }

    private getEntity(index: string): ReturnType<typeof getElasticsearchEntity> {
        const type = getElasticsearchEntityType(index);
        return getElasticsearchEntity({
            type,
            context: this.context
        });
    }
}
