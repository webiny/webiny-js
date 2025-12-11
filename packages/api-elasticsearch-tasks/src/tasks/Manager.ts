import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { Client } from "@webiny/api-elasticsearch";
import { createElasticsearchClient } from "@webiny/api-elasticsearch";
import { createTable } from "~/definitions/index.js";
import type { IManager } from "~/types.js";
import { createEntry } from "~/definitions/entry.js";
import type { BatchReadItem, IEntity } from "@webiny/db-dynamodb";
import { batchReadAll } from "@webiny/db-dynamodb";
import type { TaskController } from "@webiny/api-core/features/task/TaskController/abstractions.js";

export interface ManagerParams<T> {
    controller: TaskController.Interface;
    documentClient?: DynamoDBDocument;
    elasticsearchClient?: Client;
}

export class Manager<T> implements IManager<T> {
    public readonly documentClient: DynamoDBDocument;
    public readonly elasticsearch: Client;
    public readonly table: ReturnType<typeof createTable>;
    public readonly controller: TaskController.Interface;

    private readonly entities: Record<string, IEntity> = {};

    public constructor(params: ManagerParams<T>) {
        this.controller = params.controller;
        this.documentClient = params?.documentClient || getDocumentClient();

        this.elasticsearch =
            params?.elasticsearchClient ||
            createElasticsearchClient({
                endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
            });

        this.table = createTable({
            documentClient: this.documentClient
        });
    }

    public getEntity(name: string): IEntity {
        if (this.entities[name]) {
            return this.entities[name];
        }

        return (this.entities[name] = createEntry({
            table: this.table,
            entityName: name
        }));
    }

    public async read<T>(items: BatchReadItem[]): Promise<T[]> {
        return await batchReadAll<T>({
            table: this.table,
            items
        });
    }
}
