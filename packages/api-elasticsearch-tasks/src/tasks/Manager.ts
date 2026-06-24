import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { createOpenSearchEntity, createOpenSearchTable } from "@webiny/api-opensearch";
import { Manager as Abstraction } from "~/abstractions/Manager.js";
import type { BatchReadItem } from "@webiny/db-dynamodb/utils/batch/batchRead.js";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batch/batchRead.js";
import type { IEntity } from "@webiny/db-dynamodb";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { DynamoDBClient } from "@webiny/db-dynamodb/exports/api/db.js";

class ManagerImpl implements Abstraction.Interface {
    public readonly controller: TaskController.Interface;
    public readonly documentClient;
    public readonly openSearchClient;
    public readonly table;

    private readonly entities: Record<string, IEntity> = {};

    public constructor(
        openSearchClient: OpenSearchClient.Interface,
        dynamoDBClient: DynamoDBClient.Interface,
        controller: TaskController.Interface
    ) {
        this.controller = controller;
        this.documentClient = dynamoDBClient.client;
        this.openSearchClient = openSearchClient.use();

        this.table = createOpenSearchTable({
            documentClient: this.documentClient
        });
    }

    public getEntity(name: string): IEntity {
        if (this.entities[name]) {
            return this.entities[name];
        }

        return (this.entities[name] = createOpenSearchEntity({
            table: this.table,
            entityName: name
        }));
    }

    public async read<T>(items: BatchReadItem[]): Promise<T[]> {
        return await batchReadAll<T>({
            client: this.table.table,
            items
        });
    }
}

export const Manager = Abstraction.createImplementation({
    implementation: ManagerImpl,
    dependencies: [OpenSearchClient, DynamoDBClient, TaskController]
});
