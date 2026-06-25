import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { createOpenSearchEntity } from "@webiny/api-opensearch";
import { createOpenSearchTable } from "@webiny/api-opensearch";
import { Manager as Abstraction } from "~/abstractions/Manager.js";
import type { BatchReadItem } from "@webiny/db-dynamodb/utils/batch/batchRead.js";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batch/batchRead.js";
import type { IEntity } from "@webiny/db-dynamodb";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";

class ManagerImpl implements Abstraction.Interface {
    public readonly controller: TaskController.Interface;
    public readonly openSearchClient;
    public readonly table: DynamoDbDocumentClient.Interface;

    private readonly entityFactory: DynamoDbEntityFactory.Interface;
    private readonly entities: Record<string, IEntity> = {};

    public constructor(
        openSearchClient: OpenSearchClient.Interface,
        tableFactory: DynamoDbTableFactory.Interface,
        entityFactory: DynamoDbEntityFactory.Interface,
        controller: TaskController.Interface
    ) {
        this.controller = controller;
        this.openSearchClient = openSearchClient.use();
        this.entityFactory = entityFactory;

        this.table = createOpenSearchTable({
            tableFactory
        });
    }

    public getEntity(name: string): IEntity {
        if (this.entities[name]) {
            return this.entities[name];
        }

        return (this.entities[name] = createOpenSearchEntity({
            client: this.table,
            entityFactory: this.entityFactory,
            entityName: name
        }));
    }

    public async read<T>(items: BatchReadItem[]): Promise<T[]> {
        return await batchReadAll<T>({
            client: this.table,
            items
        });
    }
}

export const Manager = Abstraction.createImplementation({
    implementation: ManagerImpl,
    dependencies: [OpenSearchClient, DynamoDbTableFactory, DynamoDbEntityFactory, TaskController]
});
