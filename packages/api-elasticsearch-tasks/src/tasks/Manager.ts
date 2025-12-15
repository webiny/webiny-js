import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { Client } from "@webiny/api-elasticsearch";
import { createTable } from "~/definitions/index.js";
import type { IManager } from "~/types.js";
import { createEntry } from "~/definitions/entry.js";
import type { BatchReadItem, IEntity } from "@webiny/db-dynamodb";
import { batchReadAll } from "@webiny/db-dynamodb";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface ManagerParams<
    T extends TaskDefinition.TaskInput,
    O extends TaskDefinition.TaskOutput
> {
    documentClient: DynamoDBDocument;
    elasticsearchClient: Client;
    controller: TaskController.Interface<T, O>;
}

export class Manager<
    T extends TaskDefinition.TaskInput,
    O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
> implements IManager<T, O>
{
    public readonly controller: TaskController.Interface<T, O>;
    public readonly documentClient: DynamoDBDocument;
    public readonly elasticsearch: Client;
    public readonly table: ReturnType<typeof createTable>;

    private readonly entities: Record<string, IEntity> = {};

    public constructor(params: ManagerParams<T, O>) {
        this.controller = params.controller;
        this.documentClient = params.documentClient;
        this.elasticsearch = params.elasticsearchClient;

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
