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
import type { IDbRegistry } from "~/abstractions/index.js";

export interface ManagerParams<T, O extends import("@webiny/api-core/features/task/TaskDefinition").ITaskResponseDoneResultOutput = import("@webiny/api-core/features/task/TaskDefinition").ITaskResponseDoneResultOutput> {
    controller: TaskController.Interface<T, O>;
    documentClient?: DynamoDBDocument;
    elasticsearchClient?: Client;
    dbRegistry?: IDbRegistry;
}

export class Manager<T, O extends import("@webiny/api-core/features/task/TaskDefinition").ITaskResponseDoneResultOutput = import("@webiny/api-core/features/task/TaskDefinition").ITaskResponseDoneResultOutput> implements IManager<T, O> {
    public readonly documentClient: DynamoDBDocument;
    public readonly elasticsearch: Client;
    public readonly table: ReturnType<typeof createTable>;
    public readonly controller: TaskController.Interface<T, O>;
    public readonly dbRegistry: IDbRegistry | undefined;

    private readonly entities: Record<string, IEntity> = {};

    public constructor(params: ManagerParams<T, O>) {
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

        this.dbRegistry = params.dbRegistry;
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
