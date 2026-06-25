import { batchReadAll } from "@webiny/db-dynamodb/utils/batch/batchRead.js";
import { createSynchronizationBuilder } from "@webiny/api-dynamodb-to-elasticsearch";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import {
    ElasticsearchSynchronize as Abstraction,
    type IElasticsearchSynchronizeExecuteParams,
    type IElasticsearchSynchronizeExecuteResponse
} from "./abstractions/ElasticsearchSynchronize.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { DbRegistry } from "@webiny/db/exports/api/db.js";
import type { IEntity } from "@webiny/db-dynamodb";
import type { IStandardEntityAttributes } from "@webiny/db-dynamodb/exports/api/db.js";
import type { NonEmptyArray } from "@webiny/api/types.js";

enum EntityType {
    CMS = "headless-cms"
}

interface IGetElasticsearchEntityTypeParams {
    SK: string;
    index: string;
}

const createEntityPredicate = (app: string, tags: NonEmptyArray<string>) => {
    return (item: DbRegistry.RegistryItem) => {
        return item.app === app && tags.every(tag => item.tags.includes(tag));
    };
};

const createTablePredicate = (app: string, tags: NonEmptyArray<string>) => {
    return (item: DbRegistry.RegistryItem) => {
        return item.app === app && tags.every(tag => item.tags.includes(tag));
    };
};

interface IDynamoDbItem {
    PK: string;
    SK: string;
}

class ElasticsearchSynchronizeImpl implements Abstraction.Interface {
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

        const table = this.getTable("es");

        const readableItems = items.map(item => {
            const entity = this.getEntity(item);
            return {
                Key: entity.item.schema.toGetKeys({
                    PK: item.PK,
                    SK: item.SK
                })
            };
        });

        const tableItems = await batchReadAll<IDynamoDbItem>({
            client: table,
            items: readableItems
        });

        const elasticsearchSyncBuilder = createSynchronizationBuilder({
            openSearchClient: this.openSearchClient.use(),
            timer: this.controller.runtime
        });
        /* We need to find the items we have in the Elasticsearch but not in the DynamoDB-Elasticsearch table. */
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

    private getEntity(params: IGetElasticsearchEntityTypeParams) {
        const type = this.getElasticsearchEntityType(params);

        const getByPredicate = (predicate: (item: DbRegistry.RegistryItem) => boolean) => {
            return this.dbRegistry.getOneItem<IEntity<IStandardEntityAttributes>>(predicate);
        };

        try {
            switch (type) {
                case EntityType.CMS:
                    return getByPredicate(createEntityPredicate("cms", ["es"]));
            }
        } catch {}
        throw new Error(`Unknown entity type "${type}".`);
    }

    private getTable(type: "regular" | "es") {
        const getByPredicate = (predicate: (item: DbRegistry.RegistryItem) => boolean) => {
            const item = this.dbRegistry.getOneItem<IEntity>(predicate);
            return item.item;
        };

        const entity = getByPredicate(createTablePredicate("cms", [type]));
        if (!entity) {
            throw new Error(`Unknown entity type "${type}".`);
        }
        return entity.client;
    }

    private getElasticsearchEntityType(params: IGetElasticsearchEntityTypeParams): EntityType {
        if (params.index.includes("-headless-cms-")) {
            return EntityType.CMS;
        }

        throw new Error(`Unknown entity type for item "${JSON.stringify(params)}".`);
    }
}

export const ElasticsearchSynchronize = Abstraction.createImplementation({
    implementation: ElasticsearchSynchronizeImpl,
    dependencies: [TaskController, DbRegistry, OpenSearchClient]
});
